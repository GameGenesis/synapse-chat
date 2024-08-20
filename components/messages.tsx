import { CombinedMessage } from "@/lib/types";
import { useCallback, useMemo, useState } from "react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Badge,
    Button
} from "@/components/ui";
import { CustomMarkdown } from "./markdown";
import { FileIcon } from "@radix-ui/react-icons";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { RefreshIcon } from "./icons";
import {
    ClipboardCheckIcon,
    ClipboardCopyIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from "lucide-react";
import { USER_NAME } from "@/app/api/chat/config";
import { Message } from "ai";
import dynamic from "next/dynamic";
import { models } from "@/lib/utils/model-provider";
import ReadUrlCard from "./tools/readurl";

const ImageGallery = dynamic(
    () => import("@/components/tools").then((mod) => mod.ImageGallery),
    { ssr: false }
);
const RelatedSearches = dynamic(
    () => import("@/components/tools").then((mod) => mod.RelatedSearches),
    { ssr: false }
);
const SourceCard = dynamic(
    () => import("@/components/tools").then((mod) => mod.SourceCard),
    { ssr: false }
);
const TimeCard = dynamic(
    () => import("@/components/tools").then((mod) => mod.TimeCard),
    { ssr: false }
);
const WeatherCard = dynamic(
    () => import("@/components/tools").then((mod) => mod.WeatherCard),
    { ssr: false }
);
const WikipediaSearchCard = dynamic(
    () => import("@/components/tools").then((mod) => mod.WikipediaSearchCard),
    { ssr: false }
);
const WikipediaSummaryCard = dynamic(
    () => import("@/components/tools").then((mod) => mod.WikipediaSummaryCard),
    { ssr: false }
);
const AttachmentPreview = dynamic(() => import("./attachmentpreview"), {
    ssr: false
});
const AttachmentModal = dynamic(() => import("./attachmentmodal"), {
    ssr: false
});

interface MessagesProps {
    messages: CombinedMessage[];
    onArtifactClick: (identifier: string) => void;
    onRegenerate?: () => void;
    addMessage?: (message: Message) => void;
}

export const Messages = ({
    messages,
    onArtifactClick,
    onRegenerate,
    addMessage
}: MessagesProps) => {
    return (
        <>
            {messages.map((message, index) =>
                message.role === "user" ? (
                    <UserMessage key={message.id} message={message} />
                ) : message.role === "assistant" ? (
                    <AssistantMessage
                        key={message.id}
                        message={message}
                        onArtifactClick={onArtifactClick}
                        onRegenerate={onRegenerate}
                        isLatestResponse={index === messages.length - 1}
                        addMessage={addMessage}
                    />
                ) : null
            )}
        </>
    );
};

interface UserMessageProps {
    message: CombinedMessage;
}

export const UserMessage = ({ message }: UserMessageProps) => {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="w-9 h-9 border flex-shrink-0">
                <AvatarImage
                    src={`https://avatar.oxro.io/avatar.svg?name=${USER_NAME.replace(
                        " ",
                        "+"
                    )}`}
                />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden mb-2">
                <div className="flex items-center justify-between align-middle pt-1 pr-1">
                    <div className="font-bold text-lg">{USER_NAME}</div>
                    <CopyButton content={message.originalContent} />
                </div>
                <div className="text-muted-foreground text-wrap w-full">
                    <CustomMarkdown html={message.processedContent} />
                </div>
                {message.attachments && message.attachments.length > 0 && (
                    <AttachmentPreview attachments={message.attachments} />
                )}
            </div>
        </div>
    );
};

interface AssistantMessageProps {
    message: CombinedMessage | string;
    isLatestResponse: boolean;
    onArtifactClick?: (identifier: string) => void;
    onRegenerate?: () => void;
    addMessage?: (message: Message) => void;
}

export const AssistantMessage = ({
    message,
    isLatestResponse,
    onArtifactClick,
    onRegenerate,
    addMessage
}: AssistantMessageProps) => {
    const [showAllSources, setShowAllSources] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

    const processedContent = useMemo(() => {
        if (typeof message === "string") return message;

        if (!message.originalContent || !message.processedContent) return null;

        if (!message.artifact || !onArtifactClick) {
            return <CustomMarkdown html={message.processedContent} />;
        }

        const parts = message.processedContent.split(/(\[ARTIFACT:[^\]]+\])/);
        const elements = parts.map((part, index) => {
            const match = part.match(/\[ARTIFACT:([^\]]+)\]/);
            if (match && match[1] === message.artifact?.identifier) {
                return (
                    <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onArtifactClick(message.artifact?.identifier || "")
                        }
                        className="inline-flex items-center gap-2 my-1"
                    >
                        <span className="text-xs font-bold uppercase text-gray-500">
                            {message.artifact?.type}
                        </span>
                        <span>{message.artifact?.title}</span>
                    </Button>
                );
            }
            return part;
        });

        return (
            <>
                {elements.map((element, index) =>
                    typeof element === "string" ? (
                        <CustomMarkdown key={index} html={element} />
                    ) : (
                        element
                    )
                )}
            </>
        );
    }, [message, onArtifactClick]);

    const formatToolArgs = (args: Record<string, any>): string => {
        return Object.entries(args)
            .map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, " $1").trim();
                const capitalizedKey =
                    formattedKey.charAt(0).toUpperCase() +
                    formattedKey.slice(1);
                const formattedValue =
                    typeof value === "string" ? value : JSON.stringify(value);
                return `${capitalizedKey}: ${formattedValue.substring(0, 500)}`;
            })
            .join("\n");
    };

    const renderSources = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const bingSearchInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "bing_web_search"
        );

        if (
            !bingSearchInvocation ||
            bingSearchInvocation.state != "result" ||
            !bingSearchInvocation.result
        )
            return null;

        const { webPages, videos, relatedSearches } =
            bingSearchInvocation.result;
        const sources = [...(webPages?.value || []), ...(videos?.value || [])];

        if (sources.length === 0) return null;

        const visibleSources = showAllSources ? sources : sources.slice(0, 3);

        return (
            <>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Sources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {visibleSources.map((source, index) => (
                            <SourceCard key={index} source={source} />
                        ))}
                    </div>
                    {sources.length > 3 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllSources(!showAllSources)}
                            className="mt-4"
                        >
                            {showAllSources ? (
                                <>
                                    <ChevronUpIcon className="w-4 h-4 mr-2" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDownIcon className="w-4 h-4 mr-2" />
                                    View {sources.length - 3} more
                                </>
                            )}
                        </Button>
                    )}
                </div>
                {relatedSearches && relatedSearches.value && (
                    <RelatedSearches
                        searches={relatedSearches.value}
                        addMessage={addMessage ? addMessage : () => {}}
                    />
                )}
            </>
        );
    };

    const handleOpenTranscript = (transcript: string) => {
        const file = new File([transcript], "transcript.txt", {
            type: "text/plain"
        });
        setTranscriptFile(file);
        setIsModalOpen(true);
    };

    const renderTranscriptPreview = (message: CombinedMessage) => {
        const transcriptTool = message.toolInvocations?.find(
            (tool) => tool.toolName === "get_youtube_video_transcript"
        );

        if (
            transcriptTool &&
            transcriptTool.state === "result" &&
            transcriptTool.result?.transcript
        ) {
            return (
                <div>
                    <h3 className="text-lg font-semibold mb-2">
                        Video Transcript
                    </h3>
                    <div
                        className="flex items-center max-w-80 p-2 pr-4 bg-white border border-input rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                            handleOpenTranscript(
                                transcriptTool.result.transcript
                            )
                        }
                    >
                        <div className="flex-shrink-0 w-10 h-10 mr-3">
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                            </div>
                        </div>
                        <div className="flex-grow min-w-0 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                transcript.txt
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                text/plain
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderImages = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const bingSearchInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "bing_web_search"
        );

        if (
            !bingSearchInvocation ||
            bingSearchInvocation.state !== "result" ||
            !bingSearchInvocation.result ||
            !bingSearchInvocation.result.images ||
            !bingSearchInvocation.result.images.value
        )
            return null;

        const images = bingSearchInvocation.result.images.value;

        if (images.length === 0) return null;

        return <ImageGallery images={images} />;
    };

    const renderWikipediaSummary = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const wikipediaSummaryInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "wikipedia_get_page_summary"
        );

        if (
            !wikipediaSummaryInvocation ||
            wikipediaSummaryInvocation.state !== "result" ||
            !wikipediaSummaryInvocation.result
        )
            return null;

        const summary = wikipediaSummaryInvocation.result;

        return <WikipediaSummaryCard summary={summary} />;
    };

    const renderWikipediaSearch = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const wikipediaSummaryInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "wikipedia_search"
        );

        if (
            !wikipediaSummaryInvocation ||
            wikipediaSummaryInvocation.state !== "result" ||
            !wikipediaSummaryInvocation.result
        )
            return null;

        const searchResults = wikipediaSummaryInvocation.result.pages;

        return <WikipediaSearchCard results={searchResults} />;
    };

    const renderTimeCard = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const timeInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "get_current_time"
        );

        if (
            !timeInvocation ||
            timeInvocation.state !== "result" ||
            !timeInvocation.result
        )
            return null;

        const { time } = timeInvocation.result;
        const { timeZone } = timeInvocation.args;

        return <TimeCard time={time} timeZone={timeZone} />;
    };

    const renderWeatherCard = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const weatherInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "get_current_weather"
        );

        if (
            !weatherInvocation ||
            weatherInvocation.state !== "result" ||
            !weatherInvocation.result
        )
            return null;

        return <WeatherCard weather={weatherInvocation.result} />;
    };

    const renderReadURLCard = () => {
        if (typeof message === "string" || !message.toolInvocations)
            return null;

        const readURLInvocation = message.toolInvocations.find(
            (tool) => tool.toolName === "readUrl"
        );

        if (
            !readURLInvocation ||
            readURLInvocation.state !== "result" ||
            !readURLInvocation.result ||
            readURLInvocation.result === ""
        )
            return null;

        return (
            <ReadUrlCard
                result={readURLInvocation.result}
                url={readURLInvocation.args.url}
                returnFormat={readURLInvocation.args.returnFormat || "markdown"}
            />
        );
    };

    return (
        <>
            <div className="flex items-start gap-4">
                <Avatar className="w-9 h-9 border flex-shrink-0">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>OA</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden mb-2">
                    <div className="flex items-center justify-between align-middle pt-1 pr-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">Assistant</span>
                            {typeof message !== "string" && message.model && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="flex align-middle">
                                            <Badge>
                                                {models[message.model]?.name}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="flex flex-col space-y-1 max-w-96 overflow-auto">
                                                <span className="font-bold text-sm">
                                                    {
                                                        models[message.model]
                                                            ?.name
                                                    }
                                                </span>
                                                <span>
                                                    Output Tokens:{" "}
                                                    {message.completionTokens ||
                                                        "N/A"}
                                                </span>
                                                <span>
                                                    Context Tokens:{" "}
                                                    {message.promptTokens ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="flex h-full align-middle">
                            {isLatestResponse && onRegenerate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRegenerate}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                    Regenerate
                                </Button>
                            )}
                            <CopyButton
                                content={
                                    typeof message === "string"
                                        ? message
                                        : message.originalContent
                                }
                            />
                        </div>
                    </div>
                    <div className="text-muted-foreground text-wrap w-full">
                        {processedContent}
                    </div>
                    <div className="flex flex-col space-y-4">
                        {renderTimeCard()}
                        {renderWeatherCard()}
                        {renderWikipediaSearch()}
                        {renderWikipediaSummary()}
                        {renderImages()}
                        {renderSources()}
                        {renderReadURLCard()}
                        {typeof message !== "string" &&
                            renderTranscriptPreview(message)}
                    </div>
                    {typeof message !== "string" &&
                        message.toolInvocations &&
                        message.toolInvocations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {message.toolInvocations.map((tool) => (
                                    <TooltipProvider key={tool.toolCallId}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Badge variant="outline">
                                                    {tool.toolName}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="flex flex-col space-y-2 max-w-96 overflow-auto">
                                                    <span className="font-bold text-sm">
                                                        Tool Arguments
                                                    </span>
                                                    <div className="whitespace-pre-wrap text-sm">
                                                        {formatToolArgs(
                                                            tool.args
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        )}
                </div>
            </div>
            <AttachmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                file={transcriptFile}
                fallback={transcriptFile ? undefined : ""}
            />
        </>
    );
};

interface CopyButtonProps {
    content: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ content }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }, [content]);

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="ml-2"
            aria-label="Copy message content"
        >
            {isCopied ? (
                <ClipboardCheckIcon className="w-4 h-4 text-green-500" />
            ) : (
                <ClipboardCopyIcon className="w-4 h-4" />
            )}
        </Button>
    );
};
