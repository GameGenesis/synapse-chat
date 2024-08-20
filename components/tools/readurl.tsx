import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import Link from "next/link";
import showdown from "showdown";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

interface ReadUrlCardProps {
    result: string;
    returnFormat?: "text" | "html" | "markdown" | "screenshot";
}

const ReadUrlCard: React.FC<ReadUrlCardProps> = ({
    result,
    returnFormat = "text"
}) => {
    if (!result || typeof result !== "string") {
        return null;
    }

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const converter = new showdown.Converter();

    // Parse the result string
    const lines = result.split("\n");
    const title =
        lines[0].replace("Title: ", "").slice(0, 100) +
        (lines[0].length > 100 ? "..." : "");
    const url = lines[2].replace("URL Source: ", "");
    const publishedTime = lines[4].replace("Published Time: ", "");
    const content = lines.slice(6).join("\n");

    // Process content based on return format
    let processedContent: string;
    let previewContent: string;
    switch (returnFormat) {
        case "html":
            processedContent = content;
            previewContent =
                content.replace(/<[^>]*>/g, "").slice(0, 150) + "...";
            break;
        case "markdown":
            processedContent = converter.makeHtml(content);
            previewContent = content.slice(0, 150) + "...";
            break;
        case "screenshot":
            processedContent = `<img src="${content}" alt="Screenshot of the webpage" style="max-width: 100%; height: auto;">`;
            previewContent = "Screenshot available. Click to view.";
            break;
        default: // 'text'
            processedContent = content;
            previewContent = content.slice(0, 150) + "...";
    }

    // Function to safely get hostname
    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    return (
        <>
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
                    <p className="text-sm text-gray-600 mb-4">
                        {previewContent}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDialogOpen(true)}
                        className="w-full"
                    >
                        {returnFormat === "screenshot"
                            ? "View Screenshot"
                            : "Read full content"}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogTitle className="text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="flex items-center">
                        <GlobeIcon className="w-6 h-6 text-gray-500 mr-2" />
                        <span className="text-sm font-medium truncate">
                            {getHostname(url)}
                        </span>
                    </DialogDescription>
                    <div className="flex-grow overflow-auto">
                        <div className="flex flex-col h-full w-full">
                            {returnFormat === "screenshot" ? (
                                <img
                                    src={content}
                                    alt="Screenshot of the webpage"
                                    style={{ maxWidth: "100%", height: "auto" }}
                                />
                            ) : (
                                <div
                                    className="prose max-w-none p-4 overflow-auto"
                                    dangerouslySetInnerHTML={{
                                        __html: processedContent
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ReadUrlCard;
