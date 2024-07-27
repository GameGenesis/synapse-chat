import { CombinedMessage } from "@/types";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Badge,
    Button
} from "@/components/ui";
import { CustomMarkdown } from "./markdown";
import AttachmentModal from "./attachmentmodal";
import { FileIcon } from "@radix-ui/react-icons";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { RefreshIcon } from "./icons";
import Image from "next/image";
import { modelInfo } from "./chatheader";
import {
    ClipboardCheckIcon,
    ClipboardCopyIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ExternalLinkIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "lucide-react";
import { USER_NAME } from "@/app/api/chat/config";
import { Card, CardContent } from "@/components/ui/card";

interface MessagesProps {
    messages: CombinedMessage[];
    onArtifactClick: (identifier: string) => void;
    onRegenerate?: () => void;
}

export const Messages = ({
    messages,
    onArtifactClick,
    onRegenerate
}: MessagesProps) => {
    return (
        <>
            {messages.map((message, index) =>
                message.role === "user" ? (
                    <UserMessage key={message.id} message={message} />
                ) : message.role === "assistant" ? (
                    <AssistantMessage
                        key={message.id}
                        message={message}
                        onArtifactClick={onArtifactClick}
                        onRegenerate={onRegenerate}
                        isLatestResponse={index === messages.length - 1}
                    />
                ) : null
            )}
        </>
    );
};

interface UserMessageProps {
    message: CombinedMessage;
}

export const UserMessage = ({ message }: UserMessageProps) => {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="w-9 h-9 border flex-shrink-0">
                <AvatarImage
                    src={`https://avatar.oxro.io/avatar.svg?name=${USER_NAME.replace(
                        " ",
                        "+"
                    )}`}
                />
                <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 break-words w-full mb-2">
                <div className="flex items-center justify-between align-middle">
                    <div className="font-bold text-lg">{USER_NAME}</div>
                    <CopyButton content={message.originalContent} />
                </div>
                <div className="prose text-muted-foreground max-w-full">
                    <CustomMarkdown>{message.processedContent}</CustomMarkdown>
                </div>
                {message.attachments && message.attachments.length > 0 && (
                    <AttachmentPreview attachments={message.attachments} />
                )}
            </div>
        </div>
    );
};

interface AssistantMessageProps {
    message: CombinedMessage | string;
    isLatestResponse: boolean;
    onArtifactClick?: (identifier: string) => void;
    onRegenerate?: () => void;
}

export const AssistantMessage = ({
    message,
    isLatestResponse,
    onArtifactClick,
    onRegenerate
}: AssistantMessageProps) => {
    const [showAllSources, setShowAllSources] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

    const processedContent = useMemo(() => {
        if (typeof message === "string") return message;

        if (!message.artifact || !onArtifactClick) {
            return <CustomMarkdown>{message.processedContent}</CustomMarkdown>;
        }

        const parts = message.processedContent.split(/(\[ARTIFACT:[^\]]+\])/);
        const elements = parts.map((part, index) => {
            const match = part.match(/\[ARTIFACT:([^\]]+)\]/);
            if (match && match[1] === message.artifact?.identifier) {
                return (
                    <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onArtifactClick(message.artifact?.identifier || "")
                        }
                        className="my-2 inline-flex items-center gap-2"
                    >
                        <span className="text-xs font-bold uppercase text-gray-500">
                            {message.artifact?.type}
                        </span>
                        <span>{message.artifact?.title}</span>
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
    }, [message, onArtifactClick]);

    const formatToolArgs = (args: Record<string, any>): string => {
        return Object.entries(args)
            .map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, " $1").trim();
                const capitalizedKey =
                    formattedKey.charAt(0).toUpperCase() +
                    formattedKey.slice(1);
                return `${capitalizedKey}: ${value}`;
            })
            .join("\n");
    };

    const renderSources = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const bingSearchInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "bing_web_search"
        );

        if (
            !bingSearchInvocation ||
            bingSearchInvocation.state != "result" ||
            !bingSearchInvocation.result
        )
            return null;

        const { webPages, videos, relatedSearches } =
            bingSearchInvocation.result;
        const sources = [...(webPages?.value || []), ...(videos?.value || [])];

        if (sources.length === 0) return null;

        const visibleSources = showAllSources ? sources : sources.slice(0, 3);

        return (
            <>
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Sources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {visibleSources.map((source, index) => (
                            <SourceCard key={index} source={source} />
                        ))}
                    </div>
                    {sources.length > 3 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllSources(!showAllSources)}
                            className="mt-4"
                        >
                            {showAllSources ? (
                                <>
                                    <ChevronUpIcon className="w-4 h-4 mr-2" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDownIcon className="w-4 h-4 mr-2" />
                                    View {sources.length - 3} more
                                </>
                            )}
                        </Button>
                    )}
                </div>
                {relatedSearches && relatedSearches.value && (
                    <RelatedSearches searches={relatedSearches.value} />
                )}
            </>
        );
    };

    const handleOpenTranscript = (transcript: string) => {
        const file = new File([transcript], "transcript.txt", {
            type: "text/plain"
        });
        setTranscriptFile(file);
        setIsModalOpen(true);
    };

    const renderTranscriptPreview = (message: CombinedMessage) => {
        const transcriptTool = message.toolInvocations?.find(
            (tool) => tool.toolName === "get_youtube_video_transcript"
        );

        if (
            transcriptTool &&
            transcriptTool.state === "result" &&
            transcriptTool.result?.transcript
        ) {
            return (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">
                        Video Transcript
                    </h3>
                    <div
                        className="flex items-center max-w-80 p-2 pr-4 bg-white border border-input rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                            handleOpenTranscript(
                                transcriptTool.result.transcript
                            )
                        }
                    >
                        <div className="flex-shrink-0 w-10 h-10 mr-3">
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                            </div>
                        </div>
                        <div className="flex-grow min-w-0 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                transcript.txt
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                text/plain
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderImages = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const bingSearchInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "bing_web_search"
        );

        if (
            !bingSearchInvocation ||
            bingSearchInvocation.state !== "result" ||
            !bingSearchInvocation.result ||
            !bingSearchInvocation.result.images ||
            !bingSearchInvocation.result.images.value
        )
            return null;

        const images = bingSearchInvocation.result.images.value;

        if (images.length === 0) return null;

        return <ImageGallery images={images} />;
    };

    return (
        <>
            <div className="flex items-start gap-4">
                <Avatar className="w-9 h-9 border flex-shrink-0">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>OA</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 break-words w-full mb-2">
                    <div className="flex items-center justify-between align-middle">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">Assistant</span>
                            {typeof message !== "string" && message.model && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="flex h-full align-middle">
                                            <Badge>{message.model}</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="flex flex-col space-y-1 max-w-96 overflow-auto">
                                                <span className="font-bold text-sm">
                                                    {
                                                        modelInfo[message.model]
                                                            ?.name
                                                    }
                                                </span>
                                                <span>
                                                    Output Tokens:{" "}
                                                    {message.completionTokens ||
                                                        "N/A"}
                                                </span>
                                                <span>
                                                    Context Tokens:{" "}
                                                    {message.promptTokens ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="flex h-full align-middle">
                            {isLatestResponse && onRegenerate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRegenerate}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                    Regenerate
                                </Button>
                            )}
                            <CopyButton
                                content={
                                    typeof message === "string"
                                        ? message
                                        : message.originalContent
                                }
                            />
                        </div>
                    </div>
                    <div className="prose text-muted-foreground">
                        {processedContent}
                    </div>
                    {renderImages()}
                    {renderSources()}
                    {typeof message !== "string" &&
                        renderTranscriptPreview(message)}
                    {typeof message !== "string" &&
                        message.toolInvocations &&
                        message.toolInvocations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {message.toolInvocations.map((tool) => (
                                    <TooltipProvider key={tool.toolCallId}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Badge variant="outline">
                                                    {tool.toolName}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="flex flex-col space-y-2 max-w-96 overflow-auto">
                                                    <span className="font-bold text-sm">
                                                        Tool Arguments
                                                    </span>
                                                    <div className="whitespace-pre-wrap text-sm">
                                                        {formatToolArgs(
                                                            tool.args
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        )}
                </div>
            </div>
            <AttachmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                file={transcriptFile}
                fallback={transcriptFile ? undefined : ""}
            />
        </>
    );
};

interface AttachmentPreviewProps {
    attachments?: { contentType: string; name: string; url: string }[];
}

const AttachmentPreview = ({ attachments }: AttachmentPreviewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileFallback, setSelectedFileFallback] = useState("");

    const handleAttachmentClick = (attachment: {
        contentType: string;
        name: string;
        url: string;
    }) => {
        setSelectedFile(
            new File([], attachment.name, {
                type: attachment.contentType
            })
        );
        setSelectedFileFallback(
            attachment.contentType.includes("image/")
                ? attachment.url
                : atob(attachment.url.split(",")[1])
        );
        setIsModalOpen(true);
    };

    return (
        <>
            <AttachmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                file={selectedFile}
                fallback={selectedFileFallback}
            />
            <div className="mt-2 space-y-2">
                {attachments?.map((attachment, index) => (
                    <div
                        key={index}
                        className="flex items-center max-w-80 p-2 pr-4 bg-white border border-input rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAttachmentClick(attachment)}
                    >
                        <div className="flex-shrink-0 w-10 h-10 mr-3">
                            {attachment.contentType.startsWith("image/") ? (
                                <div className="relative w-full h-full rounded-md overflow-hidden">
                                    <Image
                                        src={attachment.url}
                                        alt={attachment.name}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                    <FileIcon className="h-5 w-5 text-gray-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow min-w-0 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {attachment.contentType}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

interface CopyButtonProps {
    content: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ content }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }, [content]);

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="ml-2"
            aria-label="Copy message content"
        >
            {isCopied ? (
                <ClipboardCheckIcon className="w-4 h-4 text-green-500" />
            ) : (
                <ClipboardCopyIcon className="w-4 h-4" />
            )}
        </Button>
    );
};

interface Source {
    url?: string;
    contentUrl?: string;
    hostPageUrl?: string;
    name: string;
    displayUrl?: string;
    snippet?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: string;
    viewCount?: number;
    datePublished?: string;
    publisher?: { name: string }[];
    creator?: { name: string };
}

const SourceCard = ({ source }: { source: Source }) => {
    const isVideo =
        source.contentUrl ||
        source.hostPageUrl?.includes("video") ||
        source.thumbnailUrl;

    const getFaviconUrl = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return "/default-favicon.png";
        }
    };

    const getSourceUrl = () => {
        return source.url || source.contentUrl || source.hostPageUrl || "";
    };

    const getSourceName = () => {
        return source.name || source.displayUrl || "";
    };

    const getSourceDescription = () => {
        return source.snippet || source.description || "";
    };

    const getPublisherName = () => {
        return (
            source.publisher?.[0]?.name ||
            source.creator?.name ||
            new URL(getSourceUrl()).hostname
        );
    };

    const formatDuration = (duration: string): string => {
        const durationPattern = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const match = duration.match(durationPattern);

        if (!match) {
            throw new Error("Invalid duration format");
        }

        const hours = match[1] ? parseInt(match[1], 10) : 0;
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const seconds = match[3] ? parseInt(match[3], 10) : 0;

        const parts = [];
        if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
        if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
        if (seconds || (!hours && !minutes))
            parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

        return parts.join(", ");
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={getSourceUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                                <div className="flex items-center mb-2">
                                    <Image
                                        src={getFaviconUrl(getSourceUrl())}
                                        alt={`${getPublisherName()} icon`}
                                        width={16}
                                        height={16}
                                        className="mr-2"
                                        unoptimized
                                    />
                                    <span className="text-sm font-medium truncate">
                                        {getSourceName()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {getSourceDescription()}
                                </p>
                            </CardContent>
                        </Card>
                    </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-80 p-0">
                    <div className="p-4">
                        <div className="flex items-center mb-2">
                            <Image
                                src={getFaviconUrl(getSourceUrl())}
                                alt={`${getPublisherName()} icon`}
                                width={16}
                                height={16}
                                className="mr-2"
                                unoptimized
                            />
                            <span className="text-sm text-gray-500">
                                {getPublisherName()}
                            </span>
                        </div>
                        <a
                            href={getSourceUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline block mb-2"
                        >
                            {getSourceName()}
                            <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                        </a>
                        <p className="text-sm text-gray-700">
                            {getSourceDescription()}
                        </p>
                        {isVideo && (
                            <p className="text-sm text-gray-500 mt-2 flex flex-col">
                                {source.duration && (
                                    <span>
                                        Duration:{" "}
                                        {formatDuration(source.duration)}
                                    </span>
                                )}
                                {source.viewCount !== undefined && (
                                    <span>
                                        Views:{" "}
                                        {source.viewCount.toLocaleString()}
                                    </span>
                                )}
                                {source.datePublished && (
                                    <span>
                                        Published:{" "}
                                        {new Date(
                                            source.datePublished
                                        ).toLocaleDateString()}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const RelatedSearches = ({ searches }: { searches: any[] }) => {
    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Related Searches</h3>
            <div className="flex flex-wrap gap-2">
                {searches.map((search, index) => (
                    <a
                        key={index}
                        href={search.webSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {search.displayText}
                    </a>
                ))}
            </div>
        </div>
    );
};

const ImageGallery = ({ images }: { images: any[] }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth;
            const scrollLeft =
                direction === "left" ? -scrollAmount : scrollAmount;
            container.scrollBy({ left: scrollLeft, behavior: "smooth" });
        }
    };

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            setShowLeftArrow(container.scrollLeft > 0);
            setShowRightArrow(
                container.scrollLeft <
                    container.scrollWidth - container.clientWidth * 1.1
            );
        }
    };

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Images</h3>
            <div className="relative">
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto space-x-4 py-2 scrollbar-hide"
                    onScroll={handleScroll}
                >
                    {images.map((image, index) => (
                        <TooltipProvider key={index}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex-shrink-0 max-h-32">
                                        <a
                                            key={index}
                                            href={image.hostPageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Image
                                                src={image.thumbnailUrl}
                                                alt={image.name}
                                                width={200}
                                                height={128}
                                                objectFit="contain"
                                                style={{ maxHeight: "128px" }}
                                                className="rounded-lg object-cover cursor-pointer max-h-32"
                                                loader={() =>
                                                    image.thumbnailUrl
                                                }
                                            />
                                        </a>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    className="w-64 p-2"
                                >
                                    <p className="font-semibold">
                                        {image.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {image.hostPageDisplayUrl}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
                {showLeftArrow && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-0 top-1/2 transform -translate-y-1/2"
                        onClick={() => scroll("left")}
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                )}
                {showRightArrow && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2"
                        onClick={() => scroll("right")}
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};
