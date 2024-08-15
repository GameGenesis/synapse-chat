import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import {
    BlendIcon,
    BookOpenIcon,
    GaugeIcon,
    LayoutPanelLeftIcon,
    MessageSquarePlusIcon,
    MessageSquareTextIcon,
    MessagesSquareIcon,
    SettingsIcon,
    SparklesIcon
} from "lucide-react";
import { AutoIcon, MenuIcon, SparkleIcon, ZapIcon } from "./icons";
import { ModelKey } from "@/lib/utils/model-provider";
import { useState } from "react";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("./sidebar"), { ssr: false });

interface Props {
    artifacts: boolean;
    isArtifactsOpen: boolean;
    setIsArtifactsOpen: (open: boolean) => void;
    selectedModel: ModelKey;
    onModelSelect: (model: ModelKey) => void;
    onOpenSettings: () => void;
    onNewChat: () => void;
}

export const modelInfo: Partial<
    Record<
        ModelKey,
        {
            name: string;
            description: string;
            icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        }
    >
> = {
    claude35sonnet: {
        name: "Claude 3.5 Sonnet",
        description:
            "Anthropic's latest model, great for various applications.",
        icon: SparklesIcon
    },
    chatgpt4o: {
        name: "ChatGPT-4o",
        description:
            "Latest version of GPT-4o in ChatGPT optimized for chat uses.",
        icon: MessageSquareTextIcon
    },
    gpt4o: {
        name: "GPT-4o",
        description: "Most capable GPT-4 model for a wide range of tasks.",
        icon: SparkleIcon
    },
    gpt4omini: {
        name: "GPT-4o Mini",
        description: "Fast and efficient for most everyday tasks.",
        icon: ZapIcon
    },
    llama31_70b: {
        name: "Llama 3.1 70B (Groq)",
        description:
            "Capable and versatile open source model from Meta using Groq.",
        icon: BookOpenIcon
    },
    llama31_8b: {
        name: "Llama 3.1 8B (Groq)",
        description:
            "Instant responses from Llama 3.1 8B using Groq LPU AI inference.",
        icon: GaugeIcon
    },
    // llama_3_70b_tool_use: {
    //     name: "Llama 3 70B Tools (Groq)",
    //     description:
    //         "Previous gen Llama model from Groq specifically designed for advanced tool use.",
    //     icon: WrenchIcon
    // },
    mixtral_8x7b: {
        name: "Mixtral 8x7B (Groq)",
        description: "Open source Mixtral of experts model from Mistral AI.",
        icon: BlendIcon
    },
    auto: {
        name: "Auto",
        description: "Automatically selects the best model for your task.",
        icon: AutoIcon
    },
    agents: {
        name: "Agents",
        description: "Specialized AI agents that excel at specific tasks.",
        icon: MessagesSquareIcon
    }
};

const ChatHeader = ({
    artifacts,
    isArtifactsOpen,
    setIsArtifactsOpen,
    selectedModel,
    onModelSelect,
    onOpenSettings,
    onNewChat
}: Props) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleModelChange = (model: ModelKey) => {
        onModelSelect(model);
    };

    const getModelDisplayName = (modelKey: ModelKey) => {
        return modelInfo[modelKey]?.name;
    };

    const getModelDescription = (modelKey: ModelKey) => {
        return modelInfo[modelKey]?.description;
    };

    const getModelIcon = (modelKey: ModelKey) => {
        return modelInfo[modelKey]?.icon || SparkleIcon;
    };

    return (
        <header className="flex align-middle justify-center w-full bg-background text-foreground py-3 px-4 md:px-6 border-b">
            <div className="flex container items-center justify-between mx-auto">
                <div className="flex items-center gap-3">
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="default"
                                size="icon"
                                aria-label="Open menu"
                            >
                                <MenuIcon className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="w-[300px] sm:w-[400px] p-0"
                        >
                            <Sidebar
                                onNewChat={onNewChat}
                                onClose={() => setIsSidebarOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden md:flex"
                        onClick={onNewChat}
                        aria-label="Open new chat"
                    >
                        <MessageSquarePlusIcon className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="gap-1 rounded-md px-3 h-10 data-[state=open]:bg-muted text-lg"
                            >
                                {getModelDisplayName(selectedModel)}
                                <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="max-w-[300px]"
                        >
                            {(Object.keys(modelInfo) as ModelKey[]).map(
                                (modelKey, index) => {
                                    const Icon = getModelIcon(modelKey);
                                    return (
                                        <div key={modelKey}>
                                            {index ===
                                                Object.keys(modelInfo).length -
                                                    2 && (
                                                <DropdownMenuSeparator />
                                            )}
                                            <DropdownMenuItem
                                                className="items-start gap-2"
                                                onClick={() =>
                                                    handleModelChange(modelKey)
                                                }
                                            >
                                                <Icon className="w-4 h-4 mr-2 translate-y-1 shrink-0" />
                                                <div>
                                                    <div className="font-medium">
                                                        {getModelDisplayName(
                                                            modelKey
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground/80">
                                                        {getModelDescription(
                                                            modelKey
                                                        )}
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        </div>
                                    );
                                }
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex space-x-2">
                    {artifacts && !isArtifactsOpen && (
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => setIsArtifactsOpen(true)}
                            className="ml-auto"
                        >
                            <LayoutPanelLeftIcon className="w-4 h-4 mr-2" />
                            Open Artifacts
                        </Button>
                    )}
                    <Button
                        variant="default"
                        size="icon"
                        onClick={onOpenSettings}
                        aria-label="Open settings"
                        disabled={selectedModel === "agents"}
                    >
                        <SettingsIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
