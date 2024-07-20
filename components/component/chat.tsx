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
import { Artifact } from "@/types";
import { CustomMarkdown } from "./markdown";
import { CopyIcon, DownloadIcon, XIcon } from "./icons";
import { Mermaid } from "./mermaid";
import { ReactRenderer } from "./reactrenderer";
import ChatHeader from "./chatheader";
import ChatFooter from "./chatfooter";
import { maxToolRoundtrips } from "@/utils/consts";

export function Chat() {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        stop,
        data
    } = useChat({
        maxToolRoundtrips,

        // run client-side tools that are automatically executed:
        async onToolCall({ toolCall }) {}
    });

    const [activeTab, setActiveTab] = useState("preview");
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [currentArtifactIndex, setCurrentArtifactIndex] = useState(-1);

    // const [currentMessageData, setCurrentMessageData] = useState<{
    //     cleanMessage: string;
    //     artifact: Artifact;
    //     startMatch: RegExpMatchArray | null;
    //     endMatch: RegExpMatchArray | null;
    // }>();

    const [cleanedMessages, setCleanedMessages] = useState<string[]>([]);

    const [isArtifactsWindowOpen, setIsArtifactsWindowOpen] = useState(false);

    const currentArtifactRef = useRef<Artifact | null>(null);
    const isStreamingArtifactRef = useRef(false);
    const lastProcessedMessageRef = useRef<string | null>(null);
    const artifactAddedRef = useRef(false);

    const processMessage = useCallback(
        (content: string, index: number) => {
            let cleanedContent = content;

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

            if (startMatch && !isStreamingArtifactRef.current && !endMatch) {
                isStreamingArtifactRef.current = true;
                artifactAddedRef.current = false;
                setIsArtifactsWindowOpen(true);
                setActiveTab("code");
                setCurrentArtifactIndex(artifacts.length);
                const attributes = startMatch[1];
                currentArtifactRef.current = {
                    identifier: getAttributeValue(attributes, "identifier"),
                    type: getAttributeValue(attributes, "type"),
                    language: getAttributeValue(attributes, "language"),
                    title: getAttributeValue(attributes, "title"),
                    content: ""
                };
            }

            if (
                isStreamingArtifactRef.current &&
                currentArtifactRef.current &&
                startMatch
            ) {
                const attributes = startMatch[1];
                const identifier = getAttributeValue(attributes, "identifier");

                let artifactContent = cleanedContent;
                if (startMatch && startMatch.index) {
                    if (endMatch && endMatch.index) {
                        artifactContent = artifactContent.substring(
                            startMatch.index + startMatch[0].length,
                            endMatch.index
                        );

                        cleanedContent = `${cleanedContent.substring(
                            0,
                            startMatch.index
                        )}[ARTIFACT:${identifier}]${cleanedContent.substring(
                            endMatch.index + endMatch[0].length
                        )}`;
                    } else {
                        artifactContent = artifactContent
                            .substring(startMatch.index + startMatch[0].length)
                            .trim();

                        cleanedContent = `${cleanedContent.substring(
                            0,
                            startMatch.index
                        )}\n[ARTIFACT:${identifier}]`;
                    }
                }

                if (currentArtifactRef.current.content !== artifactContent) {
                    currentArtifactRef.current = {
                        ...currentArtifactRef.current,
                        content: artifactContent
                    };

                    if (endMatch && !artifactAddedRef.current) {
                        isStreamingArtifactRef.current = false;
                        artifactAddedRef.current = true;
                        setArtifacts((prevArtifacts) => [
                            ...prevArtifacts,
                            currentArtifactRef.current as Artifact
                        ]);
                        setActiveTab("preview");
                    }
                }
            }

            setCleanedMessages((prev) => {
                const updatedMessages = [...prev];
                updatedMessages[index] = cleanedContent;
                return updatedMessages;
            });
        },
        [artifacts.length]
    );

    useEffect(() => {
        const latestMessage = messages[messages.length - 1];
        if (
            latestMessage &&
            latestMessage.role === "assistant" &&
            latestMessage.content !== lastProcessedMessageRef.current
        ) {
            processMessage(latestMessage.content, messages.length - 1);
            lastProcessedMessageRef.current = latestMessage.content;
        }
    }, [messages, processMessage]);

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
                        <div>
                            Encountered an error while trying to display the
                            React component
                        </div>
                    );
                }
            case "application/mermaid":
                try {
                    return <Mermaid chart={artifact.content || ""} />;
                } catch (error) {
                    return (
                        <div>
                            Encountered an error while trying to display the
                            Diagram
                        </div>
                    );
                }
            case "text/markdown":
                return (
                    <CustomMarkdown className="h-full px-4 overflow-y-auto">
                        {artifact.content || ""}
                    </CustomMarkdown>
                );
            default:
                return <div>Unsupported artifact type: {artifact.type}</div>;
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
        setIsArtifactsWindowOpen(true);
        setCurrentArtifactIndex(
            artifacts.indexOf(
                artifacts.filter(
                    (artifact) => artifact.identifier === identifier
                )[0]
            ) || 0
        );
    };

    return (
        <div className="flex flex-col h-screen w-full">
            <div className="flex flex-grow overflow-hidden">
                <div
                    className={`flex flex-col ${
                        isArtifactsWindowOpen ? "w-3/5" : "w-full"
                    } h-full bg-background transition-all duration-300`}
                >
                    <ChatHeader
                        isArtifactsWindowOpen={isArtifactsWindowOpen}
                        setIsArtifactsWindowOpen={setIsArtifactsWindowOpen}
                    />
                    <div
                        className={`flex-grow h-full w-full overflow-y-auto justify-center transition-all duration-300`}
                    >
                        <div className="flex-shrink h-full p-4 space-y-4 max-w-[650px] mx-auto">
                            {messages
                                .filter((m) => m.content !== "")
                                .map((m, index) => (
                                    <Response
                                        key={m.id}
                                        role={m.role}
                                        artifact={currentArtifact || undefined}
                                        content={
                                            m.role === "user"
                                                ? m.content
                                                : cleanedMessages[index] ||
                                                  m.content
                                        }
                                        onArtifactClick={(identifier) =>
                                            openArtifact(identifier)
                                        }
                                        attachments={
                                            (m?.experimental_attachments as {
                                                contentType: string;
                                                name: string;
                                                url: string;
                                            }[]) || undefined
                                        }
                                    />
                                ))}
                            {error && (
                                <AIResponse
                                    content={`Encountered an Error: ${
                                        error.message ||
                                        error.cause ||
                                        error.name ||
                                        error.stack
                                    }`}
                                />
                            )}
                        </div>
                    </div>
                    <ChatFooter
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </div>
                {isArtifactsWindowOpen && (
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
                                    onClick={() =>
                                        setIsArtifactsWindowOpen(false)
                                    }
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
