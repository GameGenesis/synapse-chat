import { Artifact } from "@/types";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import { CustomMarkdown } from "./markdown";
import AttachmentModal from "./attachmentmodal";
import { FileIcon } from "@radix-ui/react-icons";
import { ModelKey } from "@/app/api/chat/model-provider";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { RefreshIcon } from "./icons";
import Image from "next/image";

interface ResponseProps {
    content: string;
    role: string;
    artifact?: Artifact;
    onArtifactClick: (identifier: string) => void;
    attachments?: { contentType: string; name: string; url: string }[];
    model?: ModelKey;
    tools?: string[];
    usage?: {
        completionTokens?: number;
        promptTokens?: number;
        totalTokens?: number;
    };
    onRegenerate?: () => void;
    isLatestResponse?: boolean;
}

export const Response = ({
    content,
    role,
    artifact,
    onArtifactClick,
    attachments,
    model,
    tools,
    usage,
    onRegenerate,
    isLatestResponse
}: ResponseProps) => {
    if (role !== "user" && role !== "assistant") return;

    return (
        <div>
            {role === "user" ? (
                <UserResponse attachments={attachments}>{content}</UserResponse>
            ) : (
                <AIResponse
                    content={content}
                    artifact={artifact}
                    onArtifactClick={onArtifactClick}
                    model={model}
                    tools={tools}
                    usage={usage}
                    onRegenerate={onRegenerate}
                    isLatestResponse={isLatestResponse}
                />
            )}
        </div>
    );
};

interface AIResponseProps {
    content: string;
    artifact?: Artifact;
    onArtifactClick?: (identifier: string) => void;
    model?: ModelKey;
    tools?: string[];
    usage?: {
        completionTokens?: number;
        promptTokens?: number;
        totalTokens?: number;
    };
    onRegenerate?: () => void;
    isLatestResponse?: boolean;
}

interface UserResponseProps {
    children: React.ReactNode;
    attachments?: { contentType: string; name: string; url: string }[];
}

export const UserResponse = ({ children, attachments }: UserResponseProps) => {
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
                {attachments && attachments.length > 0 && (
                    <AttachmentPreview attachments={attachments} />
                )}
            </div>
        </div>
    );
};

export const AIResponse = ({
    content,
    artifact,
    onArtifactClick,
    model,
    tools,
    usage,
    onRegenerate,
    isLatestResponse
}: AIResponseProps) => {
    const processedContent = useMemo(() => {
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
            <div className="grid gap-1 break-words w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Assistant</span>
                        {model && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="font-semibold text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                            {model}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {usage && (
                                            <div className="flex flex-col space-y-1">
                                                <span>
                                                    Output Tokens:{" "}
                                                    {usage?.completionTokens ||
                                                        "N/A"}
                                                </span>
                                                <span>
                                                    Context Tokens:{" "}
                                                    {usage?.promptTokens ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
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
                </div>
                <div className="prose text-muted-foreground">
                    {processedContent}
                </div>
                {tools && tools.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {tools.map((tool, index) => (
                            <span
                                key={index}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                            >
                                {tool}
                            </span>
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
