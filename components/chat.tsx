"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useReducer,
    useLayoutEffect
} from "react";
import { Messages, AssistantMessage } from "./messages";
import { useChat } from "ai/react";
import { Action, Artifact, CombinedMessage, Data, Settings } from "@/lib/types";
import ChatHeader from "./chatheader";
import ChatFooter from "./chatfooter";
import SettingsMenu from "./settings";
import {
    DEFAULT_ENABLE_ARTIFACTS,
    DEFAULT_ENABLE_INSTRUCTIONS,
    DEFAULT_ENABLE_LOGIC_MODE,
    DEFAULT_ENABLE_MEMORY,
    DEFAULT_ENABLE_PASTE_TO_FILE,
    DEFAULT_ENABLE_SAFEGUARDS,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MESSAGE_LIMIT,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    DEFAULT_TOOL_CHOICE,
    DEFAULT_TOPP,
    maxToolRoundtrips
} from "@/app/api/chat/config";
import ContinueButton from "./continuebutton";
import dynamic from "next/dynamic";
import DefaultPromptsSkeleton from "./defaultpromptsskeleton";
import { ArtifactsWindow } from "./artifactswindow";
import saveChat from "@/lib/utils/save-chat";
import markdownToHtml from "@/lib/utils/markdown-to-html";
import { Message } from "ai";
import { usePathname } from "next/navigation";

const DefaultPrompts = dynamic(() => import("./defaultprompts"), {
    loading: () => <DefaultPromptsSkeleton />,
    ssr: false
});

const reducer = (state: Settings, action: Action): Settings => {
    switch (action.type) {
        case "SET_MODEL":
            return { ...state, model: action.payload };
        case "SET_TEMPERATURE":
            return { ...state, temperature: action.payload };
        case "SET_MAX_TOKENS":
            return { ...state, maxTokens: action.payload };
        case "SET_TOP_P":
            return { ...state, topP: action.payload };
        case "SET_MESSAGE_LIMIT":
            return { ...state, messageLimit: action.payload };
        case "SET_ENABLE_ARTIFACTS":
            return { ...state, enableArtifacts: action.payload };
        case "SET_ENABLE_INSTRUCTIONS":
            return { ...state, enableInstructions: action.payload };
        case "SET_ENABLE_SAFEGUARDS":
            return { ...state, enableSafeguards: action.payload };
        case "SET_ENABLE_LOGIC_MODE":
            return { ...state, enableLogicMode: action.payload };
        case "SET_ENABLE_PASTE_TO_FILE":
            return { ...state, enablePasteToFile: action.payload };
        case "SET_ENABLE_MEMORY":
            return { ...state, enableMemory: action.payload };
        case "SET_CUSTOM_INSTRUCTIONS":
            return { ...state, customInstructions: action.payload };
        case "SET_TOOL_CHOICE":
            return { ...state, toolChoice: action.payload };
        default:
            return state;
    }
};

export function Chat({ userId, chatId }: { userId: string; chatId: string }) {
    const path = usePathname();

    const [state, dispatch] = useReducer(reducer, {
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        topP: DEFAULT_TOPP,
        maxTokens: DEFAULT_MAX_TOKENS,
        messageLimit: DEFAULT_MESSAGE_LIMIT,
        enableArtifacts: DEFAULT_ENABLE_ARTIFACTS,
        enableInstructions: DEFAULT_ENABLE_INSTRUCTIONS,
        enableSafeguards: DEFAULT_ENABLE_SAFEGUARDS,
        enableLogicMode: DEFAULT_ENABLE_LOGIC_MODE,
        enablePasteToFile: DEFAULT_ENABLE_PASTE_TO_FILE,
        enableMemory: DEFAULT_ENABLE_MEMORY,
        toolChoice: DEFAULT_TOOL_CHOICE,
        customInstructions: ""
    });

    const [activeTab, setActiveTab] = useState("preview");
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [currentArtifactIndex, setCurrentArtifactIndex] = useState(-1);

    const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const isStreamingArtifactRef = useRef(false);
    const lastProcessedMessageRef = useRef<string | null>(null);
    const lastDataIndexRef = useRef<number | undefined>();
    const shouldLoadChatRef = useRef(false);
    const shouldSaveRef = useRef(false);
    const combinedMessagesRef = useRef<CombinedMessage[]>([]);

    const [showContinueButton, setShowContinueButton] = useState(false);

    const [combinedMessages, setCombinedMessages] = useState<CombinedMessage[]>(
        []
    );

    const [regeneratingMessageId, setRegeneratingMessageId] = useState<
        string | null
    >(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            userId,
            settings: state
        },
        onResponse: (response: Response) => {
            shouldSaveRef.current = true;
            console.log("Received response from server:", response);
        },
        onFinish: (message) => {
            shouldSaveRef.current = true;
            save();
            console.log("Chat finished:", message);
        },
        onError: (error) => {
            shouldSaveRef.current = true;
            console.error("Chat error:", error);
        },
        maxToolRoundtrips,
        keepLastMessageOnError: true,

        // run client-side tools that are automatically executed:
        async onToolCall({ toolCall }) {}
    });

    useEffect(() => {
        if (!path.includes("chat") && messages.length === 1) {
            shouldLoadChatRef.current = false;
            window.history.replaceState({}, "", `/chat/${chatId}`);
        }

        if (path.includes("chat") && (!messages || messages.length === 0)) {
            shouldLoadChatRef.current = true;
        }
    }, [chatId, messages, path]);

    useEffect(() => {
        const loadExistingChat = async () => {
            if (path.includes("chat") && chatId && shouldLoadChatRef.current) {
                console.log("LOADING CHAT");
                try {
                    const response = await fetch(`/api/chat/${chatId}`);
                    if (response.ok) {
                        shouldLoadChatRef.current = false;

                        const chatData = await response.json();
                        const newCombinedMessages = chatData.messages.slice();
                        const newMessages = newCombinedMessages.map(
                            (message: CombinedMessage) => ({
                                id: message.id,
                                role: message.role,
                                content: message.originalContent,
                                toolInvocations: message.toolInvocations
                            })
                        ) as Message[];
                        setMessages(newMessages);
                        setCombinedMessages(newCombinedMessages);
                        setArtifacts(
                            newCombinedMessages
                                ?.map(
                                    (message: CombinedMessage) =>
                                        message.artifact
                                )
                                .filter(
                                    (artifact: Artifact | undefined) =>
                                        artifact !== undefined
                                ) as Artifact[]
                        );
                    } else {
                        console.error("Failed to load chat data");
                    }
                } catch (error) {
                    console.error("Error loading chat data:", error);
                }
            }
        };

        loadExistingChat();
    }, [chatId, path, setMessages, shouldLoadChatRef]);

    useEffect(() => {
        if (combinedMessages.length > 0) {
            combinedMessagesRef.current = combinedMessages;
        }
    }, [combinedMessages]);

    const save = useCallback(async () => {
        if (
            !combinedMessagesRef.current ||
            combinedMessagesRef.current.length === 0
        ) {
            return;
        }

        shouldSaveRef.current = false;
        console.log("Saving...");
        await saveChat(
            userId,
            chatId,
            combinedMessagesRef.current[0].originalContent.slice(0, 50),
            combinedMessagesRef.current,
            state
        );
        console.log("Save completed");
    }, [state, userId, chatId]);

    const processMessage = useCallback(
        (content: string, index: number) => {
            if (!state.enableArtifacts || !content.includes("<assistant")) {
                return {
                    cleanedContent: markdownToHtml(content),
                    artifact: undefined,
                    model: combinedMessages[index]?.model || state.model
                };
            }

            let cleanedContent = content;
            let artifact: Artifact | null = null;

            // Remove thinking tags
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

            const artifactStartRegex = /<assistantArtifact([^>]*)>/;
            const artifactEndRegex = /<\/assistantArtifact>/;
            const startMatch = cleanedContent.match(artifactStartRegex);
            const endMatch = cleanedContent.match(artifactEndRegex);

            if (startMatch && startMatch.index !== undefined) {
                const attributes = startMatch[1];
                console.log("ATTRIBUTES:", attributes);
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
                            .replace(/^```[\w-]*\n|\n```$/g, "")
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
                        shouldSaveRef.current = true;
                        setArtifacts((prevArtifacts) => [
                            ...prevArtifacts.slice(0, -1),
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
                            .replace(/^```[\w-]*\n|\n```$/g, "")
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
                        setArtifacts((prevArtifacts) => [
                            ...prevArtifacts,
                            artifact as Artifact
                        ]);
                    } else {
                        setArtifacts((prevArtifacts) => [
                            ...prevArtifacts.slice(0, -1),
                            artifact as Artifact
                        ]);
                    }
                }
            }

            return {
                cleanedContent: markdownToHtml(cleanedContent),
                artifact,
                model: combinedMessages[index]?.model || state.model
            };
        },
        [artifacts.length, combinedMessages, state.enableArtifacts, state.model]
    );

    useEffect(() => {
        const processMessages = () => {
            const latestMessageIndex = messages.length - 1;
            const latestMessage = messages[latestMessageIndex];

            if (!latestMessage) return;

            const { cleanedContent, artifact, model } = processMessage(
                latestMessage.content,
                latestMessageIndex
            );

            const {
                promptTokens,
                completionTokens,
                totalTokens,
                finishReason
            } =
                data && data.length > 0
                    ? (data[data?.length - 1] as Data)
                    : {
                          promptTokens: undefined,
                          completionTokens: undefined,
                          totalTokens: undefined,
                          finishReason: undefined
                      };

            setShowContinueButton(
                finishReason === "length" && latestMessage.role === "assistant"
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
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        finishReason,
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
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        finishReason,
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
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        finishReason,
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

            if (shouldSaveRef.current) {
                console.log("COMBINED MESSAGE SHOULD SAVE...");
                save();
            }
        };

        const latestMessageIndex = messages.length - 1;
        const latestMessage = messages[latestMessageIndex];

        if (
            (latestMessage &&
                latestMessage.content !== lastProcessedMessageRef.current) ||
            (data && lastDataIndexRef.current != data.length)
        ) {
            processMessages();

            lastProcessedMessageRef.current = latestMessage.content;
            lastDataIndexRef.current = data?.length;

            console.log("MESSAGES: ", combinedMessages);
        }
    }, [
        messages,
        state.model,
        processMessage,
        combinedMessages,
        regeneratingMessageId,
        data,
        save
    ]);

    // Modify the reload function to set the regeneratingMessageId
    const handleReload = useCallback(() => {
        const lastAssistantMessage = combinedMessages.findLast(
            (m) => m.role === "assistant"
        );
        if (lastAssistantMessage) {
            setRegeneratingMessageId(lastAssistantMessage.id);
        }
        shouldSaveRef.current = true;
        reload();
    }, [combinedMessages, reload]);

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

    const scrollToBottom = useCallback(() => {
        if (messagesContainerRef.current && messagesEndRef.current) {
            const containerHeight = messagesContainerRef.current.clientHeight;
            const contentHeight = messagesContainerRef.current.scrollHeight;
            const bottomOffset = contentHeight - containerHeight;

            messagesContainerRef.current.scrollTo({
                top: bottomOffset,
                behavior: "auto"
            });
        }
    }, []);

    useLayoutEffect(() => {
        scrollToBottom();
    }, [combinedMessages, scrollToBottom]);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            <SettingsMenu
                isOpen={isSettingsOpen}
                onClose={() => {
                    save();
                    setIsSettingsOpen(false);
                }}
                settings={state}
                dispatch={dispatch}
            />
            <div className="flex flex-grow overflow-hidden">
                <div
                    className={`flex flex-col ${
                        isArtifactsOpen ? "w-[55%]" : "w-full"
                    } h-full bg-background transition-all duration-300`}
                >
                    <ChatHeader
                        artifacts={artifacts && artifacts.length > 0}
                        isArtifactsOpen={isArtifactsOpen}
                        setIsArtifactsOpen={setIsArtifactsOpen}
                        selectedModel={state.model}
                        onModelSelect={(newModel) =>
                            dispatch({ type: "SET_MODEL", payload: newModel })
                        }
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                    <div
                        ref={messagesContainerRef}
                        className="flex-grow w-full h-full overflow-y-auto justify-center transition-all duration-300"
                    >
                        <div className="flex-shrink h-full p-4 space-y-4 max-w-[700px] mx-auto">
                            {combinedMessages.length === 0 &&
                            !path.includes("chat") ? (
                                <DefaultPrompts addMessage={append} />
                            ) : (
                                <Messages
                                    messages={combinedMessages}
                                    onArtifactClick={openArtifact}
                                    onRegenerate={handleReload}
                                    addMessage={append}
                                />
                            )}
                            {error && (
                                <AssistantMessage
                                    message="Encountered an Error"
                                    onRegenerate={reload}
                                    isLatestResponse
                                />
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <ContinueButton
                        show={showContinueButton}
                        onHide={() => setShowContinueButton(false)}
                        appendMessage={append}
                    />
                    <ChatFooter
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        handleStop={() => {
                            stop();
                            shouldSaveRef.current = true;
                        }}
                        enablePasteToFile={state.enablePasteToFile}
                    />
                </div>
                <ArtifactsWindow
                    isOpen={isArtifactsOpen}
                    onClose={() => setIsArtifactsOpen(false)}
                    artifacts={artifacts}
                    currentArtifactIndex={currentArtifactIndex}
                    setCurrentArtifactIndex={setCurrentArtifactIndex}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isStreamingArtifactRef={isStreamingArtifactRef}
                />
            </div>
        </div>
    );
}
