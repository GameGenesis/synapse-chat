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
import { ClipboardCheckIcon, ClipboardCopyIcon } from "lucide-react";

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
            <Avatar className="w-8 h-8 border flex-shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 break-words w-full">
                <div className="flex items-center justify-between">
                    <div className="font-bold">You</div>
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
                        className="my-2"
                    >
                        {message.artifact?.title}
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

    return (
        <div className="flex items-start gap-4">
            <Avatar className="w-8 h-8 border flex-shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
            </Avatar>
            <div className="grid gap-1 break-words w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Assistant</span>
                        {typeof message !== "string" && message.model && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge>{message.model}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="flex flex-col space-y-1">
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
                    <div className="flex">
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
                                            <div className="flex flex-col space-y-2">
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
            <div className="mt-4 space-y-2">
                {attachments?.map((attachment, index) => (
                    <div
                        key={index}
                        className="flex items-center max-w-80 p-2 pr-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAttachmentClick(attachment)}
                    >
                        <div className="flex-shrink-0 w-10 h-10 mr-3">
                            {attachment.contentType.startsWith("image/") ? (
                                <div className="relative w-full h-full rounded overflow-hidden">
                                    <Image
                                        src={attachment.url}
                                        alt={attachment.name}
                                        layout="fill"
                                        objectFit="cover"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                                    <FileIcon className="h-5 w-5 text-gray-400" />
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
