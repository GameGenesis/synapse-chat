"use client;";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

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

    const processMessage = useCallback((content: string) => {
        const artifactStartRegex = /<assistantArtifact([^>]*)>/;
        const artifactEndRegex = /<\/assistantArtifact>/;
        const startMatch = content.match(artifactStartRegex);
        const endMatch = content.match(artifactEndRegex);

        if (startMatch && !isStreamingArtifactRef.current && !endMatch) {
            isStreamingArtifactRef.current = true;
            artifactAddedRef.current = false;
            setActiveTab("code");
            setCurrentArtifactIndex((prev) => prev + 1);
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
                    setArtifacts((prev) => [
                        ...prev,
                        currentArtifactRef.current as Artifact
                    ]);
                    setActiveTab("preview");
                }
            }
        }
    }, []);

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
                case "svg":
                case "text/html":
                    return (
                        <div
                            dangerouslySetInnerHTML={{
                                __html: artifact.content || ""
                            }}
                        />
                    );
                case "application/vnd.ant.react":
                    try {
                        const Component = new Function(
                            `return (${artifact.content})`
                        )();
                        return <Component />;
                    } catch (error) {
                        return <div>Error rendering React component.</div>;
                    }
                case "text/markdown":
                    <Markdown>{artifact.content}</Markdown>;
                default:
                    return (
                        <div>Unsupported artifact type: {artifact.type}</div>
                    );
            }
        },
        []
    );

    const cleanMessage = useCallback((content: string) => {
        const tagIndex = content.indexOf("<assistant");
        return tagIndex !== -1
            ? content.slice(0, tagIndex).trim()
            : content.trim();
    }, []);

    const handlePreviousArtifact = () => {
        setCurrentArtifactIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNextArtifact = () => {
        setCurrentArtifactIndex((prev) =>
            Math.min(prev + 1, artifacts.length - 1)
        );
    };

    const currentArtifact =
        artifacts[currentArtifactIndex] || currentArtifactRef.current;

    return (
        <div className="flex flex-col h-screen w-full">
            <header className="bg-primary text-primary-foreground py-3 px-4 md:px-6">
                <div className="container mx-auto flex items-center justify-between">
                    <h1 className="text-lg font-medium">Chatbot</h1>
                </div>
            </header>
            <div className="flex flex-grow overflow-hidden">
                <div className="flex flex-col w-3/5 h-full bg-background">
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages
                            .filter((m) => m.content !== "")
                            .map((m) => (
                                <Response key={m.id} role={m.role}>
                                    {m.role === "assistant"
                                        ? cleanMessage(m.content)
                                        : m.content}
                                </Response>
                            ))}
                    </div>
                    <div className="w-full bg-background py-2 px-4 border-t">
                        <form className="relative" onSubmit={handleSubmit}>
                            <input
                                placeholder="Type your message..."
                                name="message"
                                id="message"
                                className="min-h-[48px] rounded-2xl resize-none p-4 border border-neutral-400 shadow-sm pr-16 w-full"
                                value={input}
                                onChange={handleInputChange}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || input.length === 0}
                                className="absolute w-8 h-8 top-3 right-3"
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </div>
                </div>
                <div className="w-2/5 bg-background border-l flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <div className="font-medium">Artifacts</div>
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePreviousArtifact}
                                disabled={currentArtifactIndex <= 0}
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </Button>
                            <span className="mx-2">
                                {currentArtifactIndex + 1} /{" "}
                                {Math.max(
                                    artifacts.length,
                                    currentArtifactIndex + 1
                                )}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNextArtifact}
                                disabled={
                                    currentArtifactIndex >= artifacts.length - 1
                                }
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="h-full flex flex-col"
                    >
                        <TabsList className="border-b grid grid-cols-2">
                            <TabsTrigger value="preview" className="w-full">
                                Preview
                            </TabsTrigger>
                            <TabsTrigger value="code" className="w-full">
                                Code
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent
                            value="preview"
                            className="h-full overflow-hidden"
                        >
                            <div className="h-full overflow-y-auto p-4">
                                <div className="prose max-w-full break-words">
                                    <h3>{currentArtifact?.title}</h3>
                                    {renderArtifactPreview(currentArtifact)}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent
                            value="code"
                            className="h-full overflow-hidden"
                        >
                            {currentArtifact && (
                                <SyntaxHighlighter
                                    language={
                                        currentArtifact.language || "javascript"
                                    }
                                    style={dracula}
                                    customStyle={{
                                        margin: 0,
                                        minHeight: "90%",
                                        maxHeight: "90%"
                                    }}
                                    className="h-full overflow-y-auto text-wrap bg-gray-900"
                                >
                                    {currentArtifact.content || ""}
                                </SyntaxHighlighter>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function ArrowUpIcon(props: any) {
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
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
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

function Response({
    children,
    role
}: {
    children: React.ReactNode;
    role: string;
}) {
    return (
        <div>
            {role === "user" ? (
                <UserResponse>{children}</UserResponse>
            ) : (
                <AIResponse>{children}</AIResponse>
            )}
        </div>
    );
}

function AIResponse({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="w-8 h-8 border flex-shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 break-words">
                <div className="font-bold">Assistant</div>
                <div className="prose text-muted-foreground max-w-full">
                    <Markdown>{children?.toString()}</Markdown>
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
                    <Markdown>{children?.toString()}</Markdown>
                </div>
            </div>
        </div>
    );
}
