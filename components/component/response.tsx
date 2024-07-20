import { Artifact } from "@/types";
import { Children, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import { CustomMarkdown } from "./markdown";
import { Loader2 } from "lucide-react";
import AttachmentModal from "./modal";
import { FileIcon } from "@radix-ui/react-icons";

export const Response = ({
    content,
    role,
    artifact,
    onArtifactClick,
    attachments
}: {
    content: string;
    role: string;
    artifact?: Artifact;
    onArtifactClick: (identifier: string) => void;
    attachments?: { contentType: string; name: string; url: string }[];
}) => {
    return (
        <div>
            {role === "user" ? (
                <UserResponse attachments={attachments}>{content}</UserResponse>
            ) : (
                <AIResponse
                    content={content}
                    artifact={artifact}
                    onArtifactClick={onArtifactClick}
                />
            )}
        </div>
    );
};

export const AIResponse = ({
    content,
    artifact,
    onArtifactClick
}: {
    content: string;
    artifact?: Artifact;
    onArtifactClick?: (identifier: string) => void;
}) => {
    const processedContent = useMemo(() => {
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
                        <img
                            className="rounded-md my-2 cursor-pointer"
                            width={250}
                            height={250}
                            key={index}
                            src={attachment.url}
                            alt={attachment.name}
                            onClick={() => handleAttachmentClick(attachment)}
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
