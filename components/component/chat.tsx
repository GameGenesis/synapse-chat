"use client;";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useContext
} from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
    prism,
    darcula,
    oneDark,
    duotoneDark,
    vscDarkPlus,
    nord,
    xonokai
    //
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    ArrowUpIcon,
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

    const processMessage = useCallback((content: string) => {
        const artifactStartRegex = /<assistantArtifact([^>]*)>/;
        const artifactEndRegex = /<\/assistantArtifact>/;
        const startMatch = content.match(artifactStartRegex);
        const endMatch = content.match(artifactEndRegex);

        if (startMatch && !isStreamingArtifactRef.current && !endMatch) {
            isStreamingArtifactRef.current = true;
            artifactAddedRef.current = false;
            setActiveTab("code");
            setCurrentArtifactIndex(artifacts.length + 1);
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
                                            ) || currentArtifactIndex
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
                        <div className="font-medium">
                            {currentArtifact?.title || "Artifacts"}
                        </div>
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePreviousArtifact}
                                disabled={currentArtifactIndex <= 0}
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </Button>
                            <span className="mx-2 text-nowrap">
                                {Math.min(
                                    currentArtifactIndex + 1,
                                    isStreamingArtifactRef.current
                                        ? artifacts.length + 1
                                        : artifacts.length
                                )}{" "}
                                /{" "}
                                {isStreamingArtifactRef.current
                                    ? artifacts.length + 1
                                    : artifacts.length}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNextArtifact}
                                disabled={
                                    currentArtifactIndex >=
                                    (isStreamingArtifactRef.current
                                        ? artifacts.length
                                        : artifacts.length - 1)
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
                            className="flex-grow overflow-hidden flex flex-col"
                        >
                            <div className="flex-grow-0 overflow-y-auto text-wrap">
                                {renderArtifactPreview(currentArtifact)}
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
                                    style={xonokai}
                                    customStyle={{
                                        paddingLeft: 0,
                                        margin: 0,
                                        minHeight: "90%",
                                        maxHeight: "90%"
                                    }}
                                    showLineNumbers={true}
                                    lineNumberContainerStyle={{
                                        paddingRight: "5px"
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
                ></AIResponse>
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
                return (
                    <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => onArtifactClick(artifact.identifier)}
                        className="my-2"
                    >
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
