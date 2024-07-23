import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Response, AIResponse } from "./response";
import { useChat } from "ai/react";
import { Artifact, CombinedMessage } from "@/types";
import ChatHeader from "./chatheader";
import ChatFooter from "./chatfooter";
import { ModelKey } from "@/app/api/chat/model-provider";
import { SettingsMenu } from "./settings";
import {
    DEFAULT_ENABLE_ARTIFACTS,
    DEFAULT_ENABLE_INSTRUCTIONS,
    DEFAULT_ENABLE_SAFEGUARDS,
    DEFAULT_ENABLE_TOOLS,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    maxToolRoundtrips
} from "@/app/api/chat/config";
import DefaultPrompts from "./defaultprompts";
import { generateId } from "ai";
import { FastForwardIcon } from "lucide-react";
import { ArtifactsWindow } from "./artifactswindow";

export function Chat() {
    const [model, setModel] = useState<ModelKey>(DEFAULT_MODEL);
    const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
    const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
    const [enableArtifacts, setEnableArtifacts] = useState(
        DEFAULT_ENABLE_ARTIFACTS
    );
    const [enableInstructions, setEnableInstructions] = useState(
        DEFAULT_ENABLE_INSTRUCTIONS
    );
    const [enableSafeguards, setEnableSafeguards] = useState(
        DEFAULT_ENABLE_SAFEGUARDS
    );
    const [enableTools, setEnableTools] = useState(DEFAULT_ENABLE_TOOLS);
    const [customInstructions, setCustomInstructions] = useState("");

    const {
        messages,
        setMessages,
        input,
        append,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        stop,
        reload,
        data
    } = useChat({
        body: {
            model,
            temperature,
            maxTokens,
            enableArtifacts,
            enableInstructions,
            enableSafeguards,
            enableTools,
            customInstructions
        },
        onResponse: (response: Response) => {
            console.log("Received response from server:", response);
        },
        onFinish: (message) => {
            console.log("Chat finished:", message);
        },
        onError: (error) => {
            console.error("Chat error:", error);
        },
        maxToolRoundtrips,

        // run client-side tools that are automatically executed:
        async onToolCall({ toolCall }) {}
    });

    const [activeTab, setActiveTab] = useState("preview");
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [currentArtifactIndex, setCurrentArtifactIndex] = useState(-1);

    const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const currentArtifactRef = useRef<Artifact | null>(null);
    const isStreamingArtifactRef = useRef(false);
    const lastProcessedMessageRef = useRef<string | null>(null);

    const [showContinueButton, setShowContinueButton] = useState(false);

    const [combinedMessages, setCombinedMessages] = useState<CombinedMessage[]>(
        []
    );

    const processMessage = useCallback(
        (content: string, index: number) => {
            if (!content.includes("<assistant")) {
                return {
                    cleanedContent: content,
                    artifact: undefined,
                    model: combinedMessages[index]?.model || model
                };
            }

            let cleanedContent = content;
            let artifact: Artifact | null = null;

            // CLEANING THINKING START
            const thinkingTagStartRegex = /<assistantThinking[^>]*>/;
            const thinkingTagEndRegex = /<\/assistantThinking>/;
            const thinkingTagStartMatch = content.match(thinkingTagStartRegex);
            const thinkingTagEndMatch = content.match(thinkingTagEndRegex);

            if (
                thinkingTagStartMatch &&
                thinkingTagEndMatch &&
                thinkingTagEndMatch.index
            ) {
                cleanedContent = `${content.substring(
                    0,
                    thinkingTagStartMatch.index
                )}${content.substring(
                    thinkingTagEndMatch.index + thinkingTagEndMatch[0].length
                )}`.trim();
            } else if (thinkingTagStartMatch) {
                cleanedContent = content
                    .substring(0, thinkingTagStartMatch.index)
                    .trim();
            }
            // CLEANING THINKING END

            const artifactStartRegex = /<assistantArtifact([^>]*)>/;
            const artifactEndRegex = /<\/assistantArtifact>/;
            const startMatch = cleanedContent.match(artifactStartRegex);
            const endMatch = cleanedContent.match(artifactEndRegex);

            if (startMatch && startMatch.index !== undefined) {
                const attributes = startMatch[1];
                const identifier = getAttributeValue(attributes, "identifier");

                if (endMatch && endMatch.index !== undefined) {
                    // Complete artifact
                    artifact = {
                        identifier,
                        type: getAttributeValue(attributes, "type"),
                        language: getAttributeValue(attributes, "language"),
                        title: getAttributeValue(attributes, "title"),
                        content: cleanedContent
                            .substring(
                                startMatch.index + startMatch[0].length,
                                endMatch.index
                            )
                            .trim()
                    };

                    cleanedContent = `${cleanedContent.substring(
                        0,
                        startMatch.index
                    )}[ARTIFACT:${identifier}]${cleanedContent.substring(
                        endMatch.index + endMatch[0].length
                    )}`;

                    if (isStreamingArtifactRef.current) {
                        isStreamingArtifactRef.current = false;
                        setArtifacts((prevArtifacts) => [
                            ...prevArtifacts,
                            artifact as Artifact
                        ]);
                        setActiveTab("preview");
                    }
                } else {
                    // Incomplete artifact (streaming)
                    artifact = {
                        identifier,
                        type: getAttributeValue(attributes, "type"),
                        language: getAttributeValue(attributes, "language"),
                        title: getAttributeValue(attributes, "title"),
                        content: cleanedContent
                            .substring(startMatch.index + startMatch[0].length)
                            .trim()
                    };

                    cleanedContent = `${cleanedContent.substring(
                        0,
                        startMatch.index
                    )}[ARTIFACT:${identifier}]`;

                    if (!isStreamingArtifactRef.current) {
                        isStreamingArtifactRef.current = true;
                        setIsArtifactsOpen(true);
                        setActiveTab("code");
                        setCurrentArtifactIndex(artifacts.length);
                    }
                }

                currentArtifactRef.current = artifact;
            }

            return {
                cleanedContent,
                artifact,
                model: combinedMessages[index]?.model || model
            };
        },
        [artifacts.length, messages.length]
    );

    const [regeneratingMessageId, setRegeneratingMessageId] = useState<
        string | null
    >(null);

    useEffect(() => {
        const processMessages = () => {
            const latestMessageIndex = messages.length - 1;
            const latestMessage = messages[latestMessageIndex];

            if (!latestMessage) return;

            const { cleanedContent, artifact, model } = processMessage(
                latestMessage.content,
                latestMessageIndex
            );

            let newCombinedMessages = [...combinedMessages];

            // Check if we're regenerating a message
            if (regeneratingMessageId && latestMessage.role === "assistant") {
                // Find the index of the message we're regenerating
                const regeneratedIndex = newCombinedMessages.findIndex(
                    (m) => m.id === regeneratingMessageId
                );

                if (regeneratedIndex !== -1) {
                    // Update the regenerated message
                    newCombinedMessages[regeneratedIndex] = {
                        ...newCombinedMessages[regeneratedIndex],
                        id: latestMessage.id, // Update with the new message ID
                        originalContent: latestMessage.content,
                        processedContent: cleanedContent,
                        artifact: artifact || undefined,
                        model,
                        toolInvocations: latestMessage.toolInvocations,
                        ...(latestMessage.data as object),
                        states: [
                            ...newCombinedMessages[regeneratedIndex].states,
                            {
                                content: cleanedContent || "",
                                artifact: artifact || undefined,
                                timestamp: Date.now()
                            }
                        ]
                    };

                    // Reset the regeneratingMessageId
                    setRegeneratingMessageId(null);
                }
            } else {
                // Normal message processing (new message or update)
                const existingMessageIndex = newCombinedMessages.findIndex(
                    (m) => m.id === latestMessage.id
                );

                if (existingMessageIndex !== -1) {
                    // Update existing message
                    newCombinedMessages[existingMessageIndex] = {
                        ...newCombinedMessages[existingMessageIndex],
                        originalContent: latestMessage.content,
                        processedContent: cleanedContent,
                        artifact: artifact || undefined,
                        model,
                        toolInvocations: latestMessage.toolInvocations,
                        ...(latestMessage.data as object),
                        states: [
                            ...newCombinedMessages[
                                existingMessageIndex
                            ].states.slice(0, -1),
                            {
                                content: cleanedContent || "",
                                artifact: artifact || undefined,
                                timestamp: Date.now()
                            }
                        ]
                    };
                } else {
                    // Add new message
                    newCombinedMessages.push({
                        id: latestMessage.id,
                        role: latestMessage.role,
                        originalContent: latestMessage.content,
                        processedContent: cleanedContent || "",
                        attachments: latestMessage.experimental_attachments,
                        artifact: artifact || undefined,
                        model,
                        toolInvocations: latestMessage.toolInvocations,
                        ...(latestMessage.data as object),
                        states: [
                            {
                                content: cleanedContent || "",
                                artifact: artifact || undefined,
                                timestamp: Date.now()
                            }
                        ]
                    });
                }
            }

            setCombinedMessages(newCombinedMessages);
        };

        const latestMessageIndex = messages.length - 1;
        const latestMessage = messages[latestMessageIndex];

        if (
            latestMessage &&
            latestMessage.content !== lastProcessedMessageRef.current
        ) {
            console.log("MESSAGES: ", combinedMessages);
            processMessages();
            lastProcessedMessageRef.current = latestMessage.content;
        }
    }, [
        messages,
        model,
        processMessage,
        combinedMessages,
        regeneratingMessageId
    ]);

    // Modify the reload function to set the regeneratingMessageId
    const handleReload = useCallback(() => {
        const lastAssistantMessage = combinedMessages.findLast(
            (m) => m.role === "assistant"
        );
        if (lastAssistantMessage) {
            setRegeneratingMessageId(lastAssistantMessage.id);
        }
        reload();
    }, [combinedMessages, reload]);

    useEffect(() => {
        if (messages && messages[messages.length - 1]) {
            messages[messages.length - 1].data = data &&
                data.length > 0 && {
                    ...(messages[messages.length - 1].data as object),
                    ...(data[data?.length - 1] as object)
                };

            setShowContinueButton(
                (messages[messages.length - 1].data as any)?.finishReason ===
                    "length"
            );

            if (messages[messages.length - 1].role !== "assistant") {
                setShowContinueButton(false);
            }
        }
    }, [messages.length, data]);

    const getAttributeValue = (attributes: string, attr: string) => {
        const match = attributes.match(new RegExp(`${attr}="([^"]*)"`));
        return match ? match[1] : "";
    };

    const openArtifact = (identifier: string) => {
        setIsArtifactsOpen(true);
        setCurrentArtifactIndex(
            artifacts.indexOf(
                artifacts.filter(
                    (artifact) => artifact.identifier === identifier
                )[0]
            ) || 0
        );
    };

    const handleContinueResponse = () => {
        append({
            id: generateId(),
            role: "system",
            content: "Continue Response"
        });
        setShowContinueButton(false);
    };

    return (
        <div className="flex flex-col h-screen w-full">
            <SettingsMenu
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                selectedModel={model}
                temperature={temperature}
                setTemperature={setTemperature}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
                enableArtifacts={enableArtifacts}
                setEnableArtifacts={setEnableArtifacts}
                enableInstructions={enableInstructions}
                setEnableInstructions={setEnableInstructions}
                enableSafeguards={enableSafeguards}
                setEnableSafeguards={setEnableSafeguards}
                enableTools={enableTools}
                setEnableTools={setEnableTools}
                customInstructions={customInstructions}
                setCustomInstructions={setCustomInstructions}
            />
            <div className="flex flex-grow overflow-hidden">
                <div
                    className={`flex flex-col ${
                        isArtifactsOpen ? "w-3/5" : "w-full"
                    } h-full bg-background transition-all duration-300`}
                >
                    <ChatHeader
                        artifacts={
                            (artifacts && artifacts.length > 0) ||
                            !!currentArtifactRef.current
                        }
                        isArtifactsOpen={isArtifactsOpen}
                        setIsArtifactsOpen={setIsArtifactsOpen}
                        selectedModel={model}
                        onModelSelect={(newModel) => setModel(newModel)}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onNewChat={() => {
                            stop();
                            setMessages([]);
                            setCombinedMessages([]);
                        }}
                    />
                    <div
                        className={`flex-grow h-full w-full overflow-y-auto justify-center transition-all duration-300`}
                    >
                        <div className="flex-shrink h-full p-4 space-y-4 max-w-[650px] mx-auto">
                            {combinedMessages.length === 0 ? (
                                <DefaultPrompts
                                    addMessage={(message) => append(message)}
                                />
                            ) : (
                                combinedMessages.map((m, index) => (
                                    <Response
                                        key={m.id}
                                        role={m.role}
                                        artifact={m.artifact}
                                        content={m.processedContent}
                                        onArtifactClick={(identifier) =>
                                            openArtifact(identifier)
                                        }
                                        attachments={m.attachments}
                                        model={m.model}
                                        tools={m.toolInvocations?.map(
                                            (tool) => tool.toolName
                                        )}
                                        usage={{
                                            completionTokens:
                                                m.completionTokens,
                                            promptTokens: m.promptTokens,
                                            totalTokens: m.totalTokens
                                        }}
                                        onRegenerate={handleReload}
                                        isLatestResponse={
                                            index ===
                                                combinedMessages.length - 1 &&
                                            m.role === "assistant"
                                        }
                                    />
                                ))
                            )}
                            {error && (
                                <AIResponse
                                    content="Encountered an Error"
                                    onRegenerate={reload}
                                    isLatestResponse
                                />
                            )}
                        </div>
                    </div>
                    {showContinueButton && (
                        <div className="fixed bottom-20 left-4 z-10">
                            <Button
                                onClick={handleContinueResponse}
                                className="flex items-center space-x-2 shadow-lg"
                            >
                                <FastForwardIcon className="w-5 h-5" />
                                <span>Continue Response</span>
                            </Button>
                        </div>
                    )}
                    <ChatFooter
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        handleStop={stop}
                    />
                </div>
                <ArtifactsWindow
                    isOpen={isArtifactsOpen}
                    onClose={() => setIsArtifactsOpen(false)}
                    artifacts={artifacts}
                    currentArtifactRef={currentArtifactRef}
                    currentArtifactIndex={currentArtifactIndex}
                    setCurrentArtifactIndex={setCurrentArtifactIndex}
                    isStreamingArtifact={isStreamingArtifactRef.current}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </div>
        </div>
    );
}
