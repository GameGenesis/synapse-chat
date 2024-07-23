import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { xonokai } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/solid";
import { Artifact } from "@/types";
import { CustomMarkdown } from "./markdown";
import { CopyIcon, DownloadIcon, RefreshIcon, XIcon } from "./icons";
import { Mermaid } from "./mermaid";
import { ReactRenderer } from "./reactrenderer";
import ErrorMessage from "./errormessage";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    artifacts: Artifact[];
    currentArtifactRef: React.MutableRefObject<Artifact | null>;
    currentArtifactIndex: number;
    setCurrentArtifactIndex: (index: number) => void;
    isStreamingArtifact: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function ArtifactsWindow({
    isOpen,
    onClose,
    artifacts,
    currentArtifactRef,
    currentArtifactIndex,
    setCurrentArtifactIndex,
    isStreamingArtifact,
    activeTab,
    setActiveTab
}: Props) {
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    const currentArtifact =
        artifacts[currentArtifactIndex] || currentArtifactRef.current;

    const renderArtifactPreview = useCallback((artifact: Artifact | null) => {
        if (!artifact) return null;

        switch (artifact.type) {
            case "image/svg+xml":
                return (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: artifact.content || ""
                        }}
                    />
                );
            case "text/html":
                return (
                    <iframe
                        srcDoc={artifact.content}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                        }}
                        title={artifact.title || "Preview"}
                        sandbox="allow-scripts"
                    />
                );
            case "application/react":
                try {
                    return <ReactRenderer code={artifact.content || ""} />;
                } catch (error) {
                    return (
                        <ErrorMessage
                            title="React Component Error"
                            message="An error occurred while trying to display the React component. Please check the component code for any issues."
                        />
                    );
                }
            case "application/mermaid":
                try {
                    return <Mermaid chart={artifact.content || ""} />;
                } catch (error) {
                    return (
                        <ErrorMessage
                            title="Diagram Error"
                            message="An error occurred while trying to display the Mermaid diagram. Please verify the diagram syntax."
                        />
                    );
                }
            case "text/markdown":
                return (
                    <CustomMarkdown className="h-full px-4 overflow-y-auto">
                        {artifact.content || ""}
                    </CustomMarkdown>
                );
            default:
                return (
                    <ErrorMessage
                        title="Unsupported Artifact"
                        message={`The artifact type "${artifact.type}" is not supported.`}
                    />
                );
        }
    }, []);

    const handlePreviousArtifact = () => {
        setCurrentArtifactIndex(Math.max(currentArtifactIndex - 1, 0));
    };

    const handleNextArtifact = () => {
        setCurrentArtifactIndex(
            Math.min(
                currentArtifactIndex + 1,
                isStreamingArtifact ? artifacts.length : artifacts.length - 1
            )
        );
    };

    const handleCopyCode = useCallback(() => {
        if (currentArtifact && currentArtifact.content) {
            navigator.clipboard
                .writeText(currentArtifact.content)
                .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy code: ", err);
                });
        }
    }, [currentArtifact]);

    const handleDownload = useCallback(() => {
        if (currentArtifact && currentArtifact.content) {
            const fileName = `${
                currentArtifact.identifier || "artifact"
            }${getFileExtension(currentArtifact.type)}`;
            const blob = new Blob([currentArtifact.content], {
                type: "text/plain"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setIsDownloaded(true);
            setTimeout(() => setIsDownloaded(false), 2000);
        }
    }, [currentArtifact]);

    const handleRefreshPreview = useCallback(() => {
        if (currentArtifact && currentArtifact.content) {
            setActiveTab("code");
            setTimeout(() => setActiveTab("preview"), 0);
        }
    }, [currentArtifact, setActiveTab]);

    if (!isOpen) return null;

    return (
        <div className="max-w-2/5 w-2/5 overflow-x-hidden bg-background border-l flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-md font-medium truncate pr-4">
                    {currentArtifact?.title || "Artifacts"}
                </h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-muted">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`px-3 py-1 rounded-full ${
                                activeTab === "preview"
                                    ? "bg-background text-foreground hover:bg-white"
                                    : "text-muted-foreground"
                            }`}
                            onClick={() => setActiveTab("preview")}
                        >
                            Preview
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`px-3 py-1 rounded-full ${
                                activeTab === "code"
                                    ? "bg-background text-foreground hover:bg-white"
                                    : "text-muted-foreground"
                            }`}
                            onClick={() => setActiveTab("code")}
                        >
                            Code
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={onClose}
                    >
                        <XIcon className="w-5 h-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
            </div>
            <div className="flex-grow overflow-hidden">
                {activeTab === "preview" && (
                    <div className="h-full overflow-y-auto">
                        {renderArtifactPreview(currentArtifact!)}
                    </div>
                )}
                {activeTab === "code" && currentArtifact && (
                    <SyntaxHighlighter
                        language={currentArtifact.language || "javascript"}
                        style={xonokai}
                        customStyle={{
                            margin: 0,
                            height: "100%",
                            overflow: "auto"
                        }}
                        showLineNumbers={true}
                        lineNumberContainerStyle={{
                            paddingRight: "5px"
                        }}
                        className="h-full bg-gray-900"
                    >
                        {currentArtifact.content || ""}
                    </SyntaxHighlighter>
                )}
            </div>
            <div className="border-t flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={handleCopyCode}
                        disabled={!currentArtifact || !currentArtifact.content}
                    >
                        {isCopied ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <CopyIcon className="w-5 h-5" />
                        )}
                        <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={handleDownload}
                        disabled={!currentArtifact || !currentArtifact.content}
                    >
                        {isDownloaded ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <DownloadIcon className="w-5 h-5" />
                        )}
                        <span className="sr-only">Download</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={handleRefreshPreview}
                        disabled={!currentArtifact || !currentArtifact.content}
                    >
                        <RefreshIcon className="w-5 h-5" />
                        <span className="sr-only">Refresh Preview</span>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={handlePreviousArtifact}
                        disabled={currentArtifactIndex <= 0}
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={handleNextArtifact}
                        disabled={
                            currentArtifactIndex >=
                            (isStreamingArtifact
                                ? artifacts.length
                                : artifacts.length - 1)
                        }
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                        <span className="sr-only">Next</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

const getFileExtension = (artifactType: string): string => {
    switch (artifactType) {
        case "application/javascript":
            return ".js";
        case "application/react":
            return ".jsx";
        case "text/html":
            return ".html";
        case "text/css":
            return ".css";
        case "application/json":
            return ".json";
        case "text/markdown":
            return ".md";
        case "image/svg+xml":
            return ".svg";
        case "application/mermaid":
            return ".mmd";
        default:
            return ".txt";
    }
};
