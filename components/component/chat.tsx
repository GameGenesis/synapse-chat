"use client;";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
    prism,
    // darcula,
    // oneDark,
    // duotoneDark,
    // vscDarkPlus,
    // nord,
    xonokai
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    ArrowUpIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/solid";
import mermaid from "mermaid";
import { Runner } from "react-runner";

interface Props {
    messages: { id: string; role: string; content: string }[];
    input: string;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
    data: any;
}

interface Artifact {
    identifier: string;
    type: string;
    language: string;
    title: string;
    content: string;
}

export function Chat({
    messages,
    input,
    handleSubmit,
    handleInputChange,
    isLoading,
    data
}: Props) {
    const [activeTab, setActiveTab] = useState("preview");
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [currentArtifactIndex, setCurrentArtifactIndex] = useState(-1);

    const currentArtifactRef = useRef<Partial<Artifact> | null>(null);
    const isStreamingArtifactRef = useRef(false);
    const lastProcessedMessageRef = useRef<string | null>(null);
    const artifactAddedRef = useRef(false);

    const processMessage = useCallback(
        (content: string) => {
            const artifactStartRegex = /<assistantArtifact([^>]*)>/;
            const artifactEndRegex = /<\/assistantArtifact>/;
            const startMatch = content.match(artifactStartRegex);
            const endMatch = content.match(artifactEndRegex);

            if (startMatch && !isStreamingArtifactRef.current && !endMatch) {
                isStreamingArtifactRef.current = true;
                artifactAddedRef.current = false;
                setActiveTab("code");
                setCurrentArtifactIndex((prevIndex) => artifacts.length);
                const attributes = startMatch[1];
                currentArtifactRef.current = {
                    identifier: getAttributeValue(attributes, "identifier"),
                    type: getAttributeValue(attributes, "type"),
                    language: getAttributeValue(attributes, "language"),
                    title: getAttributeValue(attributes, "title"),
                    content: ""
                };
            }

            if (isStreamingArtifactRef.current && currentArtifactRef.current) {
                let artifactContent = content;

                if (startMatch && startMatch.index) {
                    if (endMatch && endMatch.index) {
                        artifactContent = content
                            .substring(
                                startMatch.index + startMatch[0].length,
                                endMatch.index
                            )
                            .trim();
                    } else {
                        artifactContent = content
                            .substring(startMatch.index + startMatch[0].length)
                            .trim();
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
            processMessage(latestMessage.content);
            lastProcessedMessageRef.current = latestMessage.content;
        }
    }, [messages, processMessage]);

    const getAttributeValue = (attributes: string, attr: string) => {
        const match = attributes.match(new RegExp(`${attr}="([^"]*)"`));
        return match ? match[1] : "";
    };

    const renderArtifactPreview = useCallback(
        (artifact: Partial<Artifact> | null) => {
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
                        return (
                            <DynamicReactComponent
                                code={artifact.content || ""}
                            />
                        );
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
                    return (
                        <div>Unsupported artifact type: {artifact.type}</div>
                    );
            }
        },
        []
    );

    const cleanMessage = useCallback((content: string) => {
        let cleanedContent = content;
        let artifact: Artifact | null = null;

        // Handle thinking tag
        const thinkingTagStartRegex = /<assistantThinking[^>]*>/;
        const thinkingTagEndRegex = /<\/assistantThinking>/;
        const thinkingTagStartMatch = content.match(thinkingTagStartRegex);
        const thinkingTagEndMatch = content.match(thinkingTagEndRegex);

        if (
            thinkingTagStartMatch &&
            thinkingTagEndMatch &&
            thinkingTagEndMatch.index
        ) {
            cleanedContent =
                content.substring(0, thinkingTagStartMatch.index) +
                content.substring(
                    thinkingTagEndMatch.index + thinkingTagEndMatch[0].length
                );
        } else if (thinkingTagStartMatch) {
            cleanedContent = content.substring(0, thinkingTagStartMatch.index);
        }

        // Handle artifact tag
        const artifactStartRegex = /<assistantArtifact([^>]*)>/;
        const artifactEndRegex = /<\/assistantArtifact>/;
        const artifactStartMatch = cleanedContent.match(artifactStartRegex);
        const artifactEndMatch = cleanedContent.match(artifactEndRegex);

        if (artifactStartMatch && artifactStartMatch.index) {
            const attributes = artifactStartMatch[1];
            const title =
                getAttributeValue(attributes, "title") || "Untitled Artifact";
            const identifier =
                getAttributeValue(attributes, "identifier") || "0";
            const type = getAttributeValue(attributes, "type");
            const language = getAttributeValue(attributes, "language");

            artifact = {
                identifier,
                title,
                type,
                language,
                content: ""
            };

            if (artifactEndMatch && artifactEndMatch.index) {
                const artifactContent = cleanedContent.slice(
                    artifactStartMatch.index + artifactStartMatch[0].length,
                    artifactEndMatch.index
                );

                artifact = {
                    ...artifact,
                    content: artifactContent
                };

                cleanedContent =
                    cleanedContent.substring(0, artifactStartMatch.index) +
                    `[ARTIFACT:${identifier}]` +
                    cleanedContent.substring(
                        artifactEndMatch.index + artifactEndMatch[0].length
                    );
            } else {
                cleanedContent = `
${cleanedContent.substring(0, artifactStartMatch.index)}
[ARTIFACT:${identifier}]
`;
            }
        }

        return { cleanedContent: cleanedContent.trim(), artifact };
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

    return (
        <div className="flex flex-col h-screen w-full">
            <div className="flex flex-grow overflow-hidden">
                <div className="flex flex-col w-3/5 h-full bg-background">
                    <header className="bg-background text-foreground py-3 px-4 md:px-6 border-b">
                        <div className="container mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full"
                                        >
                                            <MenuIcon className="w-6 h-6" />
                                            <span className="sr-only">
                                                Toggle navigation
                                            </span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left">
                                        <div className="grid gap-2 py-6" />
                                    </SheetContent>
                                </Sheet>
                            </div>
                            <div className="flex items-center gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="gap-1 rounded-xl px-3 h-10 data-[state=open]:bg-muted text-lg"
                                        >
                                            ChatGPT{" "}
                                            <span className="text-muted-foreground">
                                                3.5
                                            </span>
                                            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="max-w-[300px]"
                                    >
                                        <DropdownMenuItem className="items-start gap-2">
                                            <SparkleIcon className="w-4 h-4 mr-2 translate-y-1 shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    GPT-4
                                                </div>
                                                <div className="text-muted-foreground/80">
                                                    With DALL-E, browing and
                                                    analysis. Limit 40 messages
                                                    / 3 hours
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="items-start gap-2">
                                            <ZapIcon className="w-4 h-4 mr-2 translate-y-1 shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    GPT-3
                                                </div>
                                                <div className="text-muted-foreground/80">
                                                    Great for everyday tasks
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages
                            .filter((m) => m.content !== "")
                            .map((m) => (
                                <Response
                                    key={m.id}
                                    role={m.role}
                                    artifact={
                                        cleanMessage(m.content).artifact ||
                                        undefined
                                    }
                                    content={
                                        cleanMessage(m.content).cleanedContent
                                    }
                                    onArtifactClick={(identifier) =>
                                        setCurrentArtifactIndex(
                                            artifacts.indexOf(
                                                artifacts.filter(
                                                    (artifact) =>
                                                        artifact.identifier ===
                                                        identifier
                                                )[0]
                                            ) || 0
                                        )
                                    }
                                />
                            ))}
                    </div>
                    <div className="w-full bg-background py-2 px-4 border-t">
                        <form className="relative" onSubmit={handleSubmit}>
                            <input
                                placeholder="Type your message..."
                                name="message"
                                id="message"
                                className="rounded-full resize-none p-4 border border-neutral-400 shadow-sm pr-16 w-full bg-grey-100"
                                value={input}
                                onChange={handleInputChange}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || input.length === 0}
                                className="absolute w-8 h-8 top-3 right-3 rounded-full items-center justify-center"
                            >
                                <ArrowUpIcon className="w-4 h-4 text-primary-foreground" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </div>
                </div>
                <div className="w-2/5 bg-background border-l flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <h3 className="text-md font-medium">
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
                                    !currentArtifact || !currentArtifact.content
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
                                    !currentArtifact || !currentArtifact.content
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
            </div>
        </div>
    );
}

function CopyIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}

function DownloadIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}

function MenuIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    );
}

function SparkleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
    );
}

function XIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

function ZapIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        </svg>
    );
}

function Response({
    content,
    role,
    artifact,
    onArtifactClick
}: {
    content: string;
    role: string;
    artifact?: Artifact;
    onArtifactClick: (identifier: string) => void;
}) {
    return (
        <div>
            {role === "user" ? (
                <UserResponse>{content}</UserResponse>
            ) : (
                <AIResponse
                    content={content}
                    artifact={artifact}
                    onArtifactClick={onArtifactClick}
                />
            )}
        </div>
    );
}

function AIResponse({
    content,
    artifact,
    onArtifactClick
}: {
    content: string;
    artifact?: Artifact;
    onArtifactClick?: (identifier: string) => void;
}) {
    const processedContent = React.useMemo(() => {
        if (!artifact || !onArtifactClick) {
            return <CustomMarkdown>{content}</CustomMarkdown>;
        }

        const parts = content.split(/(\[ARTIFACT:[^\]]+\])/);
        const elements = parts.map((part, index) => {
            const match = part.match(/\[ARTIFACT:([^\]]+)\]/);
            if (match && match[1] === artifact.identifier) {
                const isGenerating = !artifact.content;
                return (
                    <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => onArtifactClick(artifact.identifier)}
                        className="my-2"
                    >
                        {isGenerating && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {artifact.title}
                    </Button>
                );
            }
            return part;
        });

        return (
            <>
                {elements.map((element, index) =>
                    typeof element === "string" ? (
                        <CustomMarkdown key={index}>{element}</CustomMarkdown>
                    ) : (
                        element
                    )
                )}
            </>
        );
    }, [content, artifact, onArtifactClick]);

    return (
        <div className="flex items-start gap-4">
            <Avatar className="w-8 h-8 border flex-shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 break-words">
                <div className="font-bold">Assistant</div>
                <div className="prose text-muted-foreground">
                    {processedContent}
                </div>
            </div>
        </div>
    );
}

function UserResponse({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="w-8 h-8 border flex-shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 break-words">
                <div className="font-bold">You</div>
                <div className="prose text-muted-foreground max-w-full">
                    <CustomMarkdown>{children?.toString()}</CustomMarkdown>
                </div>
            </div>
        </div>
    );
}

import * as Recharts from "recharts";
import * as LucideIcons from "lucide-react";
import * as RadixIcons from "@radix-ui/react-icons";
import * as ShadcnComponents from "@/components/ui";
import { Loader2 } from "lucide-react";

type ShadcnComponentType = keyof typeof ShadcnComponents;

const DynamicReactComponent = ({ code }: { code: string }) => {
    const [error, setError] = useState<string | undefined>("");

    const scope = {
        React,
        ...React,
        ...Recharts,
        ...LucideIcons,
        ...RadixIcons,
        ...ShadcnComponents,
        import: {
            react: React,
            recharts: Recharts,
            "lucide-react": LucideIcons,
            "@radix-ui/react-icons": RadixIcons,
            "@/components/ui": ShadcnComponents,
            "@/components/ui/avatar": ShadcnComponents,
            "@/components/ui/button": ShadcnComponents,
            "@/components/ui/card": ShadcnComponents,
            "@/components/ui/tabs": ShadcnComponents,
            "@/components/ui/textarea": ShadcnComponents
        }
    };

    // Remove backticks and language tag only if they're at the start or end of the code
    let processedCode = code.replace(/^```[\w-]*\n|\n```$/g, "").trim();

    return (
        <div>
            <Runner
                code={processedCode}
                scope={scope}
                onRendered={(e) => setError(e?.message)}
            />
            {error && (
                <div className="text-red-500 text-wrap overflow-y-auto mx-2">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

interface CodeProps {
    node?: any;
    inline?: any;
    className?: any;
    children?: any;
}

const CustomMarkdown = ({
    children,
    className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={`markdown-body prose max-w-full ${className}`}>
            <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => (
                        <h1
                            className="text-2xl font-bold my-4 pb-2 border-b"
                            {...props}
                        />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2
                            className="text-2xl font-semibold my-3 pb-1 border-b"
                            {...props}
                        />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-semibold my-2" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className="text-lg font-medium my-2" {...props} />
                    ),
                    h5: ({ node, ...props }) => (
                        <h5 className="text-base font-medium my-1" {...props} />
                    ),
                    h6: ({ node, ...props }) => (
                        <h6 className="text-sm font-medium my-1" {...props} />
                    ),
                    code({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                    }: CodeProps) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <div className="code-block-wrapper">
                                <SyntaxHighlighter
                                    style={prism}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                        marginTop: "0.5rem",
                                        marginBottom: "0.5rem",
                                        marginRight: "0.5rem",
                                        borderRadius: "0.375rem"
                                    }}
                                    wrapLines={true}
                                    wrapLongLines={true}
                                >
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {typeof children === "string" ? children : children?.toString()}
            </Markdown>
        </div>
    );
};

mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Fira Code, monospace",
    themeVariables: {
        background: "#2D3748",
        primaryColor: "#4FD1C5",
        secondaryColor: "#63B3ED",
        tertiaryColor: "#F687B3",
        primaryBorderColor: "#81E6D9",
        secondaryBorderColor: "#90CDF4",
        tertiaryBorderColor: "#FBB6CE",
        primaryTextColor: "#E2E8F0",
        secondaryTextColor: "#CBD5E0",
        tertiaryTextColor: "#E2E8F0",
        lineColor: "#718096",
        textColor: "#E2E8F0",
        mainBkg: "#4A5568",
        secondBkg: "#2D3748",
        mainContrastColor: "#E2E8F0",
        darkTextColor: "#1A202C",
        nodeBorder: "#81E6D9",
        clusterBkg: "#4A5568",
        clusterBorder: "#81E6D9",
        defaultLinkColor: "#CBD5E0",
        titleColor: "#F7FAFC",
        edgeLabelBackground: "#4A5568",
        actorBorder: "#81E6D9",
        actorBkg: "#4A5568",
        actorTextColor: "#E2E8F0",
        actorLineColor: "#CBD5E0",
        signalColor: "#CBD5E0",
        signalTextColor: "#E2E8F0",
        labelBoxBkgColor: "#4A5568",
        labelBoxBorderColor: "#81E6D9",
        labelTextColor: "#E2E8F0",
        loopTextColor: "#E2E8F0",
        noteBorderColor: "#81E6D9",
        noteBkgColor: "#4A5568",
        noteTextColor: "#E2E8F0",
        activationBorderColor: "#81E6D9",
        activationBkgColor: "#4A5568",
        sequenceNumberColor: "#E2E8F0",
        sectionBkgColor: "#4A5568",
        altSectionBkgColor: "#2D3748",
        sectionBkgColor2: "#2D3748",
        excludeBkgColor: "#2D3748",
        taskBorderColor: "#81E6D9",
        taskBkgColor: "#4A5568",
        taskTextLightColor: "#E2E8F0",
        taskTextColor: "#E2E8F0",
        taskTextDarkColor: "#1A202C",
        taskTextOutsideColor: "#E2E8F0",
        taskTextClickableColor: "#F7FAFC",
        activeTaskBorderColor: "#F687B3",
        activeTaskBkgColor: "#553C9A",
        gridColor: "#718096",
        doneTaskBkgColor: "#2D3748",
        doneTaskBorderColor: "#CBD5E0",
        critBorderColor: "#F687B3",
        critBkgColor: "#553C9A",
        todayLineColor: "#F687B3",
        personBorder: "#81E6D9",
        personBkg: "#4A5568"
    }
});

const Mermaid = ({ chart }: { chart: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        mermaid.contentLoaded();
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = scale + (e.deltaY > 0 ? -0.1 : 0.1);
        setScale(Math.max(0.5, Math.min(newScale, 3))); // Limit scale between 0.5 and 3
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default behavior
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        if (containerRef.current) {
            containerRef.current.style.cursor = "grabbing";
            containerRef.current.style.userSelect = "none";
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = "move";
            containerRef.current.style.userSelect = "auto";
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                overflow: "hidden",
                width: "100%",
                height: "100%",
                cursor: "move"
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-grey-100"
        >
            <div
                className="mermaid"
                style={{
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    transformOrigin: "0 0",
                    transition: isDragging ? "none" : "transform 0.1s"
                }}
            >
                {chart}
            </div>
        </div>
    );
};

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
