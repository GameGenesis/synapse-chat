import { Artifact } from "@/types";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import { CustomMarkdown } from "./markdown";
import AttachmentModal from "./modal";
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
}: {
    content: string;
    role: string;
    artifact?: Artifact;
    onArtifactClick: (identifier: string) => void;
    attachments?: { contentType: string; name: string; url: string }[];
    model?: ModelKey;
    tools?: string[];
    usage?: {
        completionTokens: number;
        promptTokens: number;
        totalTokens: number;
    };
    onRegenerate?: () => void;
    isLatestResponse?: boolean;
}) => {
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

export const AIResponse = ({
    content,
    artifact,
    onArtifactClick,
    model,
    tools,
    usage,
    onRegenerate,
    isLatestResponse
}: {
    content: string;
    artifact?: Artifact;
    onArtifactClick?: (identifier: string) => void;
    model?: ModelKey;
    tools?: string[];
    usage?: {
        completionTokens: number;
        promptTokens: number;
        totalTokens: number;
    };
    onRegenerate?: () => void;
    isLatestResponse?: boolean;
}) => {
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

export const UserResponse = ({
    children,
    attachments
}: {
    children: React.ReactNode;
    attachments?: { contentType: string; name: string; url: string }[];
}) => {
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

const AttachmentPreview = ({
    attachments
}: {
    attachments?: { contentType: string; name: string; url: string }[];
}) => {
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
        setSelectedFileFallback(atob(attachment.url.split(",")[1]));
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
            <div className="w-full overflow-y-auto flex flex-row items-center space-x-2 row-auto space-y-2">
                {attachments?.map((attachment, index) =>
                    attachment?.contentType?.startsWith("image/") ? (
                        <Image
                            className="rounded-md cursor-pointer hover:opacity-80 transition-opacity my-2"
                            width={250}
                            height={250}
                            key={index}
                            src={attachment.url}
                            alt={attachment.name}
                            onClick={() => handleAttachmentClick(attachment)}
                            loader={() => attachment.url}
                        />
                    ) : (
                        <div
                            className="my-2 flex items-center gap-2 bg-muted rounded-md p-2 hover:bg-muted/80 transition-colors cursor-pointer"
                            key={index}
                            onClick={() => handleAttachmentClick(attachment)}
                        >
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 rounded-md">
                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {attachment.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {attachment.contentType}
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </>
    );
};
