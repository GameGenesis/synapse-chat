import { CodeProps } from "@/types";
import Markdown, { Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { memo, useState } from "react";
import Image from "next/image";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import CodeBlock from "./codeblock";

export const MemoizedMarkdown: React.FC<Options> = memo(
    Markdown,
    (prevProps, nextProps) =>
        prevProps.children === nextProps.children &&
        prevProps.className === nextProps.className
);

const AttachmentModal = dynamic(() => import("./attachmentmodal"), {
    ssr: false
});

interface Props {
    children: React.ReactNode;
    className?: string;
}

export const CustomMarkdown = ({ children, className = "" }: Props) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const openImageModal = (src: string) => {
        setSelectedImage(src);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    return (
        <div className={`markdown-body prose max-w-full ${className}`}>
            <MemoizedMarkdown
                className="prose flex-wrap text-wrap overflow-auto"
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
                        return (
                            <CodeBlock
                                inline={inline}
                                className={className}
                                match={match}
                            >
                                {children}
                            </CodeBlock>
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
            </MemoizedMarkdown>
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
        domain = href;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 no-underline hover:underline inline-flex items-center"
                    >
                        {children}
                        <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-80 p-0">
                    <div className="p-4">
                        <div className="flex items-center mb-2 space-x-2 max-h-4">
                            <Image
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                alt={`${domain} icon`}
                                width={16}
                                height={16}
                            />
                            <span className="text-sm text-gray-500">
                                {domain}
                            </span>
                        </div>
                        <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 no-underline hover:underline block"
                        >
                            {href}
                            <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                        </Link>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
