import { useState } from "react";
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
import "highlight.js/styles/github.css";

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

    return (
        <div
            className={`markdown-body prose max-w-full m-0 p-0 ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
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
