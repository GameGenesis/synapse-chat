import { CodeProps } from "@/types";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import AttachmentModal from "./attachmentmodal";
import Image from "next/image";

interface Props {
    children: React.ReactNode;
    className?: string;
}

export const CustomMarkdown = ({ children, className = "" }: Props) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 3000);
        });
    };

    const openImageModal = (src: string) => {
        setSelectedImage(src);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    return (
        <div className={`markdown-body prose max-w-full ${className}`}>
            <Markdown
                className="prose"
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
                    img: ({ node, ...props }) => {
                        const { src, alt, width, height, ...rest } = props;
                        return (
                            <Image
                                {...rest}
                                src={src || ""}
                                alt={alt || "Image"}
                                onClick={() => openImageModal(src || "")}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                width={
                                    typeof width === "number"
                                        ? width
                                        : parseInt(width || "", 10) || 0
                                }
                                height={
                                    typeof height === "number"
                                        ? height
                                        : parseInt(height || "", 10) || 0
                                }
                                layout="responsive"
                                loader={() => src || ""}
                            />
                        );
                    },
                    code({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                    }: CodeProps) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <div className="code-block-wrapper relative rounded-md overflow-hidden bg-[#1e1e1e] text-white">
                                <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 text-sm">
                                    <span className="text-gray-400">
                                        {match[1]}
                                    </span>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(String(children))
                                        }
                                        className="text-gray-400 hover:text-white transition-colors duration-200"
                                    >
                                        {copiedCode === String(children)
                                            ? "Copied!"
                                            : "Copy code"}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    language={match[1]}
                                    style={vscDarkPlus}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: 0,
                                        padding: "1rem"
                                    }}
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
            <AttachmentModal
                isOpen={!!selectedImage}
                onClose={closeImageModal}
                file={
                    selectedImage
                        ? new File([selectedImage], "image.png", {
                              type: "image/png"
                          })
                        : null
                }
                fallback={selectedImage || ""}
            />
        </div>
    );
};
