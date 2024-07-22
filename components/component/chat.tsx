"use client;";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
    // prism,
    // darcula,
    // oneDark,
    // duotoneDark,
    // vscDarkPlus,
    // nord,
    xonokai
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/solid";
import { Response, AIResponse } from "./response";
import { useChat } from "ai/react";
import { Artifact, CombinedMessage } from "@/types";
import { CustomMarkdown } from "./markdown";
import { CopyIcon, DownloadIcon, RefreshIcon, XIcon } from "./icons";
import { Mermaid } from "./mermaid";
import { ReactRenderer } from "./reactrenderer";
import ChatHeader from "./chatheader";
import ChatFooter from "./chatfooter";
import { maxToolRoundtrips } from "@/utils/consts";
import { ModelKey } from "@/app/api/chat/model-provider";
import ErrorMessage from "./errormessage";
import { SettingsMenu } from "./settings";
import {
    DEFAULT_ENABLE_ARTIFACTS,
    DEFAULT_ENABLE_INSTRUCTIONS,
    DEFAULT_ENABLE_SAFEGUARDS,
    DEFAULT_ENABLE_TOOLS,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE
} from "@/app/api/chat/config";
import DefaultPrompts from "./defaultprompts";
import { generateId, Message, ToolInvocation } from "ai";
import { FastForwardIcon } from "lucide-react";

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
    const [systemPrompt, setSystemPrompt] = useState("");

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
            userPrompt: systemPrompt
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
                            ...newCombinedMessages[existingMessageIndex].states,
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

    const renderArtifactPreview = useCallback((artifact: Artifact | null) => {
        if (!artifact) return null;

        switch (artifact.type) {
            case "image/svg+xml":
                return (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: artifact.content || ""
                        }}
                    />
                );
            case "text/html":
                return (
                    <iframe
                        srcDoc={artifact.content}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                        }}
                        title={artifact.title || "Preview"}
                        sandbox="allow-scripts"
                    />
                );
            case "application/react":
                try {
                    return <ReactRenderer code={artifact.content || ""} />;
                } catch (error) {
                    return (
                        <ErrorMessage
                            title="React Component Error"
                            message="An error occurred while trying to display the React component. Please check the component code for any issues."
                        />
                    );
                }
            case "application/mermaid":
                try {
                    return <Mermaid chart={artifact.content || ""} />;
                } catch (error) {
                    return (
                        <ErrorMessage
                            title="Diagram Error"
                            message="An error occurred while trying to display the Mermaid diagram. Please verify the diagram syntax."
                        />
                    );
                }
            case "text/markdown":
                return (
                    <CustomMarkdown className="h-full px-4 overflow-y-auto">
                        {artifact.content || ""}
                    </CustomMarkdown>
                );
            default:
                return (
                    <ErrorMessage
                        title="Unsupported Artifact"
                        message={`The artifact type "${artifact.type}" is not supported.`}
                    />
                );
        }
    }, []);

    const handlePreviousArtifact = () => {
        setCurrentArtifactIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNextArtifact = () => {
        setCurrentArtifactIndex((prev) =>
            Math.min(
                prev + 1,
                isStreamingArtifactRef.current
                    ? artifacts.length + 1
                    : artifacts.length
            )
        );
    };

    const currentArtifact =
        artifacts[currentArtifactIndex] || currentArtifactRef.current;

    const currentArtifactIndexRef = useRef(currentArtifactIndex);

    useEffect(() => {
        currentArtifactIndexRef.current = currentArtifactIndex;
    }, [currentArtifactIndex]);

    const [isCopied, setIsCopied] = useState(false);

    const handleCopyCode = useCallback(() => {
        if (currentArtifact && currentArtifact.content) {
            navigator.clipboard
                .writeText(currentArtifact.content)
                .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
                })
                .catch((err) => {
                    console.error("Failed to copy code: ", err);
                });
        }
    }, [currentArtifact]);

    const [isDownloaded, setIsDownloaded] = useState(false);
    const handleDownload = useCallback(() => {
        if (currentArtifact && currentArtifact.content) {
            const fileName = `${
                currentArtifact.identifier || "artifact"
            }${getFileExtension(currentArtifact.type)}`;
            const blob = new Blob([currentArtifact.content], {
                type: "text/plain"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setIsDownloaded(true);
            setTimeout(() => setIsDownloaded(false), 2000); // Reset after 2 seconds
        }
    }, [currentArtifact]);

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

    const handleRefreshPreview = useCallback(() => {
        if (currentArtifact && currentArtifact.content) {
            // Force a re-render of the preview
            setActiveTab("code");
            setTimeout(() => setActiveTab("preview"), 0);
        }
    }, [currentArtifact]);

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
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
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
                {isArtifactsOpen && (
                    <div className="max-w-2/5 w-2/5 overflow-x-hidden bg-background border-l flex flex-col h-full">
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                            <h3 className="text-md font-medium truncate pr-4">
                                {currentArtifact?.title || "Artifacts"}
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-muted">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`px-3 py-1 rounded-full ${
                                            activeTab === "preview"
                                                ? "bg-background text-foreground hover:bg-white"
                                                : "text-muted-foreground"
                                        }`}
                                        onClick={() => setActiveTab("preview")}
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`px-3 py-1 rounded-full ${
                                            activeTab === "code"
                                                ? "bg-background text-foreground hover:bg-white"
                                                : "text-muted-foreground"
                                        }`}
                                        onClick={() => setActiveTab("code")}
                                    >
                                        Code
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() => setIsArtifactsOpen(false)}
                                >
                                    <XIcon className="w-5 h-5" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-hidden">
                            {activeTab === "preview" && (
                                <div className="h-full overflow-y-auto">
                                    {renderArtifactPreview(currentArtifact)}
                                </div>
                            )}
                            {activeTab === "code" && currentArtifact && (
                                <SyntaxHighlighter
                                    language={
                                        currentArtifact.language || "javascript"
                                    }
                                    style={xonokai}
                                    customStyle={{
                                        margin: 0,
                                        height: "100%",
                                        overflow: "auto"
                                    }}
                                    showLineNumbers={true}
                                    lineNumberContainerStyle={{
                                        paddingRight: "5px"
                                    }}
                                    className="h-full bg-gray-900"
                                >
                                    {currentArtifact.content || ""}
                                </SyntaxHighlighter>
                            )}
                        </div>
                        <div className="border-t flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={handleCopyCode}
                                    disabled={
                                        !currentArtifact ||
                                        !currentArtifact.content
                                    }
                                >
                                    {isCopied ? (
                                        <CheckCircleIcon className="w-5 h-5" />
                                    ) : (
                                        <CopyIcon className="w-5 h-5" />
                                    )}

                                    <span className="sr-only">Copy</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={handleDownload}
                                    disabled={
                                        !currentArtifact ||
                                        !currentArtifact.content
                                    }
                                >
                                    {isDownloaded ? (
                                        <CheckCircleIcon className="w-5 h-5" />
                                    ) : (
                                        <DownloadIcon className="w-5 h-5" />
                                    )}
                                    <span className="sr-only">Download</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={handleRefreshPreview}
                                    disabled={
                                        !currentArtifact ||
                                        !currentArtifact.content
                                    }
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                    <span className="sr-only">
                                        Refresh Preview
                                    </span>
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={handlePreviousArtifact}
                                    disabled={currentArtifactIndex <= 0}
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                    <span className="sr-only">Previous</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={handleNextArtifact}
                                    disabled={
                                        currentArtifactIndex >=
                                        (isStreamingArtifactRef.current
                                            ? artifacts.length
                                            : artifacts.length - 1)
                                    }
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                    <span className="sr-only">Next</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const getFileExtension = (artifactType: string): string => {
    switch (artifactType) {
        case "application/javascript":
            return ".js";
        case "application/react":
            return ".jsx";
        case "text/html":
            return ".html";
        case "text/css":
            return ".css";
        case "application/json":
            return ".json";
        case "text/markdown":
            return ".md";
        case "image/svg+xml":
            return ".svg";
        case "application/mermaid":
            return ".mmd";
        default:
            return ".txt";
    }
};
