import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import Image from "next/image";

interface Source {
    url?: string;
    contentUrl?: string;
    hostPageUrl?: string;
    name: string;
    displayUrl?: string;
    snippet?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: string;
    viewCount?: number;
    datePublished?: string;
    publisher?: { name: string }[];
    creator?: { name: string };
}

const SourceCard = ({ source }: { source: Source }) => {
    const isVideo =
        source.contentUrl ||
        source.hostPageUrl?.includes("video") ||
        source.thumbnailUrl;

    const getFaviconUrl = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return "/default-favicon.png";
        }
    };

    const getSourceUrl = () => {
        return source.url || source.contentUrl || source.hostPageUrl || "";
    };

    const getSourceName = () => {
        return source.name || source.displayUrl || "";
    };

    const getSourceDescription = () => {
        return source.snippet || source.description || "";
    };

    const getPublisherName = () => {
        return (
            source.publisher?.[0]?.name ||
            source.creator?.name ||
            new URL(getSourceUrl()).hostname
        );
    };

    const formatDuration = (duration: string): string => {
        const durationPattern = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const match = duration.match(durationPattern);

        if (!match) {
            throw new Error("Invalid duration format");
        }

        const hours = match[1] ? parseInt(match[1], 10) : 0;
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const seconds = match[3] ? parseInt(match[3], 10) : 0;

        const parts = [];
        if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
        if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
        if (seconds || (!hours && !minutes))
            parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

        return parts.join(", ");
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={getSourceUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                                <div className="flex items-center mb-2">
                                    <Image
                                        src={getFaviconUrl(getSourceUrl())}
                                        alt={`${getPublisherName()} icon`}
                                        width={16}
                                        height={16}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium truncate">
                                        {getSourceName()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {getSourceDescription()}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-80 p-0">
                    <div className="p-4">
                        <div className="flex items-center mb-2">
                            <Image
                                src={getFaviconUrl(getSourceUrl())}
                                alt={`${getPublisherName()} icon`}
                                width={16}
                                height={16}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-500">
                                {getPublisherName()}
                            </span>
                        </div>
                        <Link
                            href={getSourceUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline block mb-2"
                        >
                            {getSourceName()}
                            <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                        </Link>
                        <p className="text-sm text-gray-700">
                            {getSourceDescription()}
                        </p>
                        {isVideo && (
                            <p className="text-sm text-gray-500 mt-2 flex flex-col">
                                {source.duration && (
                                    <span>
                                        Duration:{" "}
                                        {formatDuration(source.duration)}
                                    </span>
                                )}
                                {source.viewCount !== undefined && (
                                    <span>
                                        Views:{" "}
                                        {source.viewCount.toLocaleString()}
                                    </span>
                                )}
                                {source.datePublished && (
                                    <span>
                                        Published:{" "}
                                        {new Date(
                                            source.datePublished
                                        ).toLocaleDateString()}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default SourceCard;
