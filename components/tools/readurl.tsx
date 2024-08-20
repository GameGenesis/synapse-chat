import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import showdown from "showdown";

interface ReadUrlCardProps {
    result: string;
}

const ReadUrlCard: React.FC<ReadUrlCardProps> = ({ result }) => {
    const [showFullContent, setShowFullContent] = useState(false);
    const converter = new showdown.Converter();

    // Parse the result string
    const lines = result.split("\n");
    const title = lines[0].replace("Title: ", "");
    const url = lines[2].replace("URL Source: ", "");
    const publishedTime = lines[4].replace("Published Time: ", "");
    const content = lines.slice(6).join("\n");

    // Convert markdown to HTML
    const htmlContent = converter.makeHtml(content);

    // Truncate content for preview
    const previewContent =
        htmlContent.slice(0, 300) + (htmlContent.length > 300 ? "..." : "");

    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-1">
                    Published: {new Date(publishedTime).toLocaleString()}
                </p>
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center mb-4"
                >
                    View original article
                    <ExternalLinkIcon className="inline ml-1 w-4 h-4" />
                </Link>
                <div
                    className={`prose max-w-none ${
                        showFullContent ? "" : "line-clamp-3"
                    }`}
                    dangerouslySetInnerHTML={{
                        __html: showFullContent ? htmlContent : previewContent
                    }}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullContent(!showFullContent)}
                    className="mt-4 w-full"
                >
                    {showFullContent ? (
                        <>
                            <ChevronUpIcon className="w-4 h-4 mr-2" />
                            Show less
                        </>
                    ) : (
                        <>
                            <ChevronDownIcon className="w-4 h-4 mr-2" />
                            Read full content
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

export default ReadUrlCard;
