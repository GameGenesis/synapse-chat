import { Artifact } from "@/types";
import { Children, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui";
import { CustomMarkdown } from "./markdown";
import { Loader2 } from "lucide-react";

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
    attachments?: React.ReactNode;
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
    attachments: React.ReactNode;
}) => {
    const imageAttachments = Children.toArray(attachments).filter(
        (attachment: any) => attachment.props.src
    );
    const fileAttachments = Children.toArray(attachments).filter(
        (attachment: any) =>
            attachment.props.contentType &&
            !attachment.props.contentType.startsWith("image/")
    );

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
                {imageAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 bg-red-400">
                        {imageAttachments}
                    </div>
                )}
                {fileAttachments.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 bg-green-400">
                        {fileAttachments}
                    </div>
                )}
            </div>
        </div>
    );
};
