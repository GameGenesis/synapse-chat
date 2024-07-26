import { CombinedMessage } from "@/types";
import { useCallback, useMemo, useState } from "react";
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
    ExternalLinkIcon
} from "lucide-react";
import { USER_NAME } from "@/app/api/chat/config";

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

        const { webPages, videos } = bingSearchInvocation.result;
        const sources = [...(webPages?.value || []), ...(videos?.value || [])];

        if (sources.length === 0) return null;

        const visibleSources = showAllSources ? sources : sources.slice(0, 3);

        return (
            <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Sources</h3>
                <div className="space-y-2">
                    {visibleSources.map((source, index) => (
                        <SourceItem
                            key={index}
                            source={source}
                            index={index + 1}
                        />
                    ))}
                </div>
                {sources.length > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllSources(!showAllSources)}
                        className="mt-2"
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
        );
    };

    return (
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
                                                {modelInfo[message.model]?.name}
                                            </span>
                                            <span>
                                                Output Tokens:{" "}
                                                {message.completionTokens ||
                                                    "N/A"}
                                            </span>
                                            <span>
                                                Context Tokens:{" "}
                                                {message.promptTokens || "N/A"}
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
                {renderSources()}
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
                                                    {formatToolArgs(tool.args)}
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

interface SourceItemProps {
    source: any;
    index: number;
}

const SourceItem = ({ source, index }: SourceItemProps) => {
    const [showPreview, setShowPreview] = useState(false);

    const getSourceIcon = () => {
        if (source.publisher && source.publisher[0]?.name === "reddit") {
            return "🟠"; // Orange circle for Reddit
        }
        return "🔵"; // Default blue circle
    };

    return (
        <div
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            onMouseEnter={() => setShowPreview(true)}
            onMouseLeave={() => setShowPreview(false)}
        >
            <div className="flex items-center">
                <span className="mr-2">{getSourceIcon()}</span>
                <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                >
                    {source.name}
                    <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </a>
            </div>
            {showPreview && (
                <div className="mt-2 text-sm text-gray-600">
                    {source.snippet || source.description}
                </div>
            )}
        </div>
    );
};
