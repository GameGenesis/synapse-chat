import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, FileIcon, GlobeIcon } from "lucide-react";
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
}

const ReadUrlCard: React.FC<ReadUrlCardProps> = ({ result }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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
        content.slice(0, 150) + (content.length > 150 ? "..." : "");

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
                        Read full content
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
                            <div
                                className="prose max-w-none p-4 overflow-auto"
                                dangerouslySetInnerHTML={{
                                    __html: htmlContent
                                }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ReadUrlCard;
