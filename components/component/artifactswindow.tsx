import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/solid";
import { Artifact } from "@/types";
import {
    CopyIcon,
    DownloadIcon,
    LoadingSpinner,
    RefreshIcon,
    XIcon
} from "./icons";
import dynamic from "next/dynamic";
import { captureConsoleLogs } from "@/utils/capture-logs";
import hljs from "highlight.js";
import markdownToHtml from "@/utils/markdown-to-html";

const PreviewComponent = dynamic(
    () => import("./artifactpreview").then((mod) => mod.PreviewComponent),
    {
        loading: () => <LoadingSpinner />,
        ssr: false
    }
);

const Console = dynamic(() => import("./console").then((mod) => mod.Console), {
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

    const [html, setHtml] = useState("");

    useEffect(() => {
        setConsoleLogs([]);
    }, [currentArtifactIndex]);

    useEffect(() => {
        if (
            activeTab === "preview" &&
            currentArtifact &&
            currentArtifact.type === "text/markdown"
        ) {
            setHtml(markdownToHtml(currentArtifact.content));
        }
    }, [activeTab, currentArtifact]);

    const handleClearConsole = useCallback(() => {
        setConsoleLogs([]);
    }, []);

    const renderArtifactPreview = useCallback(
        (artifact: Artifact | null) => {
            if (!artifact) return null;

            return (
                <div className="flex flex-col h-full">
                    <div className="flex-grow overflow-auto">
                        <PreviewComponent
                            artifact={artifact}
                            setConsoleLogs={setConsoleLogs}
                            html={html}
                            iframeRef={iframeRef}
                        />
                    </div>
                    <Console logs={consoleLogs} onClear={handleClearConsole} />
                </div>
            );
        },
        [consoleLogs, handleClearConsole, html]
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

    const renderCode = useCallback((artifact: Artifact) => {
        const language =
            artifact.language ||
            getFileExtension(artifact.type)
                .replace(".", "")
                .replace("mmd", "js") ||
            "plaintext";
        const code = artifact.content || "";

        // Split the code into lines
        const lines = code.split("\n");

        // Highlight the entire code block
        const highlightedCode = hljs.highlight(code, { language }).value;

        // Create an array of line number elements
        const lineNumbers = lines
            .map(
                (_, index) =>
                    `<span class="inline-block text-right w-full pr-2" key=${
                        index + 1
                    }>${index + 1}</span>`
            )
            .join("");

        return (
            <div className="h-full overflow-hidden bg-[#282c34] font-mono text-sm leading-relaxed">
                <div className="overflow-auto h-full">
                    <table className="w-full border-collapse">
                        <tbody>
                            <tr>
                                <td className="align-top select-none text-gray-500 bg-[#2c313a] p-0 w-8">
                                    <pre className="m-0 py-4 pl-2 pr-1 text-right">
                                        <code
                                            dangerouslySetInnerHTML={{
                                                __html: lineNumbers
                                            }}
                                        />
                                    </pre>
                                </td>
                                <td className="align-top p-0">
                                    <pre className="m-0 overflow-auto !text-nowrap">
                                        <code
                                            className={`hljs language-${language}`}
                                            dangerouslySetInnerHTML={{
                                                __html: highlightedCode
                                            }}
                                        />
                                    </pre>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }, []);

    useEffect(() => {
        if (
            currentArtifact &&
            (activeTab === "code" ||
                currentArtifact.type === "application/code")
        ) {
            renderCode(currentArtifact);
        }
    }, [currentArtifact, activeTab, renderCode]);

    if (!isOpen) return null;

    return (
        <div className="max-w-[45%] w-[45%] overflow-x-hidden bg-background border-l flex flex-col h-full">
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
                    currentArtifact?.type === "application/code") &&
                    currentArtifact &&
                    renderCode(currentArtifact)}
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
