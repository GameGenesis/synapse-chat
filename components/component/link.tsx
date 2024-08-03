import Image from "next/image";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

export const CustomLink = ({
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
