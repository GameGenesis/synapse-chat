import { CodeProps } from "@/types";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useState } from "react";
import AttachmentModal from "./attachmentmodal";
import Image from "next/image";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { ExternalLinkIcon } from "lucide-react";

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
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
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
                    },
                    a: ({ node, href, children, ...props }) => (
                        <CustomLink href={href} {...props}>
                            {children}
                        </CustomLink>
                    )
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

const CustomLink = ({
    href,
    children
}: {
    href?: string;
    children: React.ReactNode;
}) => {
    if (!href) {
        return <span>{children}</span>;
    }

    let domain;
    try {
        domain = new URL(href).hostname;
    } catch {
        // If the URL is invalid, just use the href as is
        domain = href;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        {children}
                        <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                    </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-80 p-0">
                    <div className="p-4">
                        <div className="flex items-center mb-2">
                            <Image
                                src={`https://www.google.com/s2/favicons?domain=${domain}`}
                                alt={`${domain} icon`}
                                width={16}
                                height={16}
                                className="mr-2"
                                unoptimized
                            />
                            <span className="text-sm text-gray-500">
                                {domain}
                            </span>
                        </div>
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline block mb-2"
                        >
                            {href}
                            <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                        </a>
                        <p className="text-sm text-gray-700">
                            Link to external website
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
