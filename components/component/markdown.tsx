import React, { useState, useMemo } from "react";
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
import "katex/dist/katex.min.css";

const AttachmentModal = dynamic(() => import("./attachmentmodal"), {
    ssr: false
});

interface Props {
    html: string;
    className?: string;
}

export const CustomMarkdown = ({ html, className = "" }: Props) => {
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

    const parsedContent = useMemo(() => {
        const regex = /___CUSTOM_(LINK|IMAGE)_(.+?)___(?:(.+?)___)?/g;
        let lastIndex = 0;
        const result = [];

        let match;
        while ((match = regex.exec(html)) !== null) {
            if (lastIndex < match.index) {
                result.push(
                    <span
                        key={`text-${lastIndex}`}
                        className={`markdown-body prose max-w-full m-0 p-0 ${className}`}
                        dangerouslySetInnerHTML={{
                            __html: html.slice(lastIndex, match.index)
                        }}
                    />
                );
            }

            const type = match[1];
            const src = decodeURIComponent(match[2]);
            const content = match[3] ? decodeURIComponent(match[3]) : null;

            if (type === "LINK") {
                result.push(
                    <CustomLink
                        key={`link-${match.index}`}
                        href={src}
                        className="inline-flex m-0 p-0"
                    >
                        {content || src}
                    </CustomLink>
                );
            } else if (type === "IMAGE") {
                result.push(
                    <Image
                        src={src || ""}
                        alt="Image"
                        onClick={() => openImageModal(src || "")}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        width={0}
                        height={0}
                        layout="responsive"
                    />
                );
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < html.length) {
            result.push(
                <span
                    key={`text-${lastIndex}`}
                    className={`markdown-body prose max-w-full m-0 p-0 ${className}`}
                    dangerouslySetInnerHTML={{ __html: html.slice(lastIndex) }}
                />
            );
        }

        return result;
    }, [className, html]);

    return (
        <>
            {parsedContent}
            {selectedImage && (
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
            )}
        </>
    );
};

const CustomLink = ({
    href,
    children,
    className
}: {
    href?: string;
    children: React.ReactNode;
    className?: string;
}) => {
    if (!href) {
        return <span className={className}>{children}</span>;
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
                        className={`text-blue-600 no-underline hover:underline inline-flex items-center ${className}`}
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
