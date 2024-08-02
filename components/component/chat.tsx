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
import { Action, Artifact, CombinedMessage, Data, State } from "@/types";
import ChatHeader from "./chatheader";
import ChatFooter from "./chatfooter";
import { SettingsMenu } from "./settings";
import {
    DEFAULT_ENABLE_ARTIFACTS,
    DEFAULT_ENABLE_INSTRUCTIONS,
    DEFAULT_ENABLE_PASTE_TO_FILE,
    DEFAULT_ENABLE_SAFEGUARDS,
    DEFAULT_MAX_TOKENS,
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
import saveChat from "@/utils/save-chat";
import { Converter } from "showdown";
import {
    showdownKatex,
    showdownFootnotes,
    showdownImage,
    showdownCode,
    showdownLink
} from "@/utils/showdown-extensions";
import purify from "dompurify";

const DefaultPrompts = dynamic(() => import("./defaultprompts"), {
    loading: () => <DefaultPromptsSkeleton />,
    ssr: false
});

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "SET_CHAT_ID":
            return { ...state, chatId: action.payload };
        case "SET_MODEL":
            return { ...state, model: action.payload };
        case "SET_TEMPERATURE":
            return { ...state, temperature: action.payload };
        case "SET_TOP_P":
            return { ...state, topP: action.payload };
        case "SET_MAX_TOKENS":
            return { ...state, maxTokens: action.payload };
        case "SET_ENABLE_ARTIFACTS":
            return { ...state, enableArtifacts: action.payload };
        case "SET_ENABLE_INSTRUCTIONS":
            return { ...state, enableInstructions: action.payload };
        case "SET_ENABLE_SAFEGUARDS":
            return { ...state, enableSafeguards: action.payload };
        case "SET_ENABLE_PASTE_TO_FILE":
            return { ...state, enablePasteToFile: action.payload };
        case "SET_CUSTOM_INSTRUCTIONS":
            return { ...state, customInstructions: action.payload };
        case "SET_TOOL_CHOICE":
            return { ...state, toolChoice: action.payload };
        default:
            return state;
    }
};

export function Chat() {
    const [state, dispatch] = useReducer(reducer, {
        chatId: null,
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        topP: DEFAULT_TOPP,
        maxTokens: DEFAULT_MAX_TOKENS,
        enableArtifacts: DEFAULT_ENABLE_ARTIFACTS,
        enableInstructions: DEFAULT_ENABLE_INSTRUCTIONS,
        enableSafeguards: DEFAULT_ENABLE_SAFEGUARDS,
        enablePasteToFile: DEFAULT_ENABLE_PASTE_TO_FILE,
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

    const [showContinueButton, setShowContinueButton] = useState(false);

    const [combinedMessages, setCombinedMessages] = useState<CombinedMessage[]>(
        []
    );

    const [regeneratingMessageId, setRegeneratingMessageId] = useState<
        string | null
    >(null);

    const [isSaving, setIsSaving] = useState(false);

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
            settings: state
        },
        onResponse: (response: Response) => {
            save();
            console.log("Received response from server:", response);
        },
        onFinish: (message) => {
            save();
            console.log("Chat finished:", message);
        },
        onError: (error) => {
            console.error("Chat error:", error);
        },
        maxToolRoundtrips,
        keepLastMessageOnError: true,

        // run client-side tools that are automatically executed:
        async onToolCall({ toolCall }) {}
    });

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
                finishReason,
                chatId
            } =
                data && data.length > 0
                    ? (data[data?.length - 1] as Data)
                    : {
                          promptTokens: undefined,
                          completionTokens: undefined,
                          totalTokens: undefined,
                          finishReason: undefined,
                          chatId: null
                      };

            setShowContinueButton(
                finishReason === "length" && latestMessage.role === "assistant"
            );

            if (!state.chatId && chatId) {
                dispatch({ type: "SET_CHAT_ID", payload: chatId });
            }

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
        state.chatId
    ]);

    const save = async () => {
        if (isSaving && !state.chatId) return;

        console.log("# BEFORE: ", state.chatId);
        setIsSaving(true);
        const newChatId = await saveChat(state.chatId, combinedMessages, state);
        if (!newChatId) return;
        dispatch({
            type: "SET_CHAT_ID",
            payload: newChatId
        });
        setIsSaving(false);
        console.log("# AFTER: ", state.chatId, "\n");
    };

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
                    save().then(() => setIsSettingsOpen(false));
                }}
                state={state}
                dispatch={dispatch}
            />
            <div className="flex flex-grow overflow-hidden">
                <div
                    className={`flex flex-col ${
                        isArtifactsOpen ? "w-3/5" : "w-full"
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
                        onNewChat={() => {
                            stop();
                            save().then(() => {
                                setMessages([]);
                                setCombinedMessages([]);
                                setArtifacts([]);
                                setCurrentArtifactIndex(-1);
                                setIsArtifactsOpen(false);
                                setShowContinueButton(false);
                                dispatch({
                                    type: "SET_CHAT_ID",
                                    payload: null
                                });
                            });
                        }}
                    />
                    <div
                        ref={messagesContainerRef}
                        className="flex-grow w-full h-full overflow-y-auto justify-center transition-all duration-300"
                    >
                        <div className="flex-shrink h-full p-4 space-y-4 max-w-[650px] mx-auto">
                            {combinedMessages.length === 0 ? (
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
                            save();
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
                />
            </div>
        </div>
    );
}

const markdownToHtml = (markdown: string) => {
    const converter = new Converter({
        tables: true,
        ghCodeBlocks: true,
        strikethrough: true,
        tasklists: true,
        ghMentions: true,
        smoothLivePreview: true,
        smartIndentationFix: true,
        disableForced4SpacesIndentedSublists: true,
        simpleLineBreaks: true,
        requireSpaceBeforeHeadingText: true,
        omitExtraWLInCodeBlocks: true,
        openLinksInNewWindow: true,
        simplifiedAutoLink: true,
        emoji: true,
        extensions: [
            showdownKatex,
            showdownFootnotes,
            showdownImage,
            showdownLink,
            showdownCode
        ]
    });
    converter.setFlavor("github");
    const html = converter.makeHtml(markdown);
    return purify.sanitize(html);
};
