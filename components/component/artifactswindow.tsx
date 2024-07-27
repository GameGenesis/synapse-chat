import React, { useState, useCallback, useEffect, useRef } from "react";
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
import {
    CopyIcon,
    DownloadIcon,
    LoadingSpinner,
    RefreshIcon,
    XIcon
} from "./icons";
import ErrorMessage from "./errormessage";
import dynamic from "next/dynamic";
import { captureConsoleLogs } from "@/utils/capture-logs";

const ReactRenderer = dynamic(
    () => import("./reactrenderer").then((mod) => mod.ReactRenderer),
    {
        loading: () => <LoadingSpinner />,
        ssr: false
    }
);

const Console = dynamic(() => import("./console").then((mod) => mod.Console), {
    loading: () => <LoadingSpinner />,
    ssr: false
});

const Mermaid = dynamic(() => import("./mermaid").then((mod) => mod.Mermaid), {
    loading: () => <LoadingSpinner />,
    ssr: false
});

interface Props {
    isOpen: boolean;
    onClose: () => void;
    artifacts: Artifact[];
    currentArtifactIndex: number;
    setCurrentArtifactIndex: (index: number) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function ArtifactsWindow({
    isOpen,
    onClose,
    artifacts,
    currentArtifactIndex,
    setCurrentArtifactIndex,
    activeTab,
    setActiveTab
}: Props) {
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);

    const currentArtifact = artifacts[currentArtifactIndex];

    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        setConsoleLogs([]);
    }, [currentArtifactIndex]);

    const handleClearConsole = useCallback(() => {
        setConsoleLogs([]);
    }, []);

    const renderArtifactPreview = useCallback(
        (artifact: Artifact | null) => {
            if (!artifact) return null;

            const PreviewComponent = () => {
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
                                ref={iframeRef}
                                srcDoc={artifact.content}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none"
                                }}
                                title={artifact.title || "Preview"}
                                sandbox="allow-scripts allow-same-origin"
                            />
                        );
                    case "application/react":
                        try {
                            return (
                                <ReactRenderer
                                    code={artifact.content || ""}
                                    setConsoleLogs={setConsoleLogs}
                                />
                            );
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
            };

            return (
                <div className="flex flex-col h-full">
                    <div className="flex-grow overflow-auto">
                        <PreviewComponent />
                    </div>
                    <Console logs={consoleLogs} onClear={handleClearConsole} />
                </div>
            );
        },
        [consoleLogs, handleClearConsole]
    );

    const handlePreviousArtifact = () => {
        setCurrentArtifactIndex(Math.max(currentArtifactIndex - 1, 0));
    };

    const handleNextArtifact = () => {
        setCurrentArtifactIndex(
            Math.min(currentArtifactIndex + 1, artifacts.length - 1)
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
            }${getFileExtension(
                currentArtifact.type,
                currentArtifact.language
            )}`;
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

    useEffect(() => {
        if (iframeRef.current && currentArtifact?.type === "text/html") {
            const iframe = iframeRef.current;
            const captureConsole = () => {
                captureConsoleLogs(iframe, (log) => {
                    setConsoleLogs((prev) => [...prev, log]);
                });
            };

            if (iframe.contentDocument?.readyState === "complete") {
                captureConsole();
            } else {
                iframe.addEventListener("load", captureConsole);
            }

            return () => {
                iframe.removeEventListener("load", captureConsole);
            };
        }
    }, [
        currentArtifact,
        currentArtifactIndex,
        activeTab,
        consoleLogs,
        setConsoleLogs,
        artifacts,
        isOpen
    ]);

    if (!isOpen) return null;

    return (
        <div className="max-w-2/5 w-2/5 overflow-x-hidden bg-background border-l flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-md font-medium truncate pr-4">
                    {currentArtifact?.title || "Artifacts"}
                </h3>
                <div className="flex items-center gap-4">
                    {currentArtifact?.type !== "application/code" && (
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
                    )}
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
                {activeTab === "preview" &&
                    currentArtifact?.type !== "application/code" && (
                        <div className="h-full overflow-y-auto">
                            {renderArtifactPreview(currentArtifact!)}
                        </div>
                    )}
                {(activeTab === "code" ||
                    currentArtifact.type === "application/code") &&
                    currentArtifact && (
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
                        disabled={currentArtifactIndex >= artifacts.length - 1}
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                        <span className="sr-only">Next</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

const getFileExtension = (artifactType: string, language?: string): string => {
    if (artifactType === "application/code" && language) {
        switch (language.toLowerCase()) {
            case "python":
                return ".py";
            case "javascript":
                return ".js";
            case "typescript":
                return ".ts";
            case "java":
                return ".java";
            case "c":
                return ".c";
            case "cpp":
            case "c++":
                return ".cpp";
            case "csharp":
            case "c#":
                return ".cs";
            case "ruby":
                return ".rb";
            case "go":
                return ".go";
            case "rust":
                return ".rs";
            case "php":
                return ".php";
            case "swift":
                return ".swift";
            case "kotlin":
                return ".kt";
            case "scala":
                return ".scala";
            default:
                return ".txt";
        }
    }

    switch (artifactType) {
        case "application/javascript":
            return ".js";
        case "application/typescript":
            return ".ts";
        case "application/react":
            return language && language.toLowerCase() === "typescript"
                ? ".tsx"
                : ".jsx";
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
