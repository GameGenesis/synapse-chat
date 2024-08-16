import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
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
import { ModelKey, ModelProvider } from "@/lib/utils/model-provider";
import { useMemo, useState } from "react";
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
            provider: ModelProvider;
        }
    >
> = {
    claude35sonnet: {
        name: "Claude 3.5 Sonnet",
        description:
            "Anthropic's latest model, great for various applications.",
        icon: SparklesIcon,
        provider: ModelProvider.Anthropic
    },
    chatgpt4o: {
        name: "ChatGPT-4o",
        description:
            "Latest version of GPT-4o in ChatGPT optimized for chat uses.",
        icon: MessageSquareTextIcon,
        provider: ModelProvider.OpenAI
    },
    gpt4o: {
        name: "GPT-4o",
        description: "Most capable GPT-4 model for a wide range of tasks.",
        icon: SparkleIcon,
        provider: ModelProvider.OpenAI
    },
    gpt4omini: {
        name: "GPT-4o Mini",
        description: "Fast and efficient for most everyday tasks.",
        icon: ZapIcon,
        provider: ModelProvider.OpenAI
    },
    llama31_70b: {
        name: "Llama 3.1 70B (Groq)",
        description:
            "Capable and versatile open source model from Meta using Groq.",
        icon: BookOpenIcon,
        provider: ModelProvider.Groq
    },
    llama31_8b: {
        name: "Llama 3.1 8B (Groq)",
        description:
            "Instant responses from Llama 3.1 8B using Groq LPU AI inference.",
        icon: GaugeIcon,
        provider: ModelProvider.Groq
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
        icon: BlendIcon,
        provider: ModelProvider.Groq
    },
    auto: {
        name: "Auto",
        description: "Automatically selects the best model for your task.",
        icon: AutoIcon,
        provider: ModelProvider.Other
    },
    agents: {
        name: "Agents",
        description: "Specialized AI agents that excel at specific tasks.",
        icon: MessagesSquareIcon,
        provider: ModelProvider.Other
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
    const [open, setOpen] = useState(false);

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

    const groupedModels = useMemo(() => {
        return Object.entries(modelInfo).reduce((acc, [key, value]) => {
            if (value) {
                const provider = value.provider;
                if (!acc[provider]) {
                    acc[provider] = [];
                }
                acc[provider].push({ key: key as ModelKey, ...value });
            }
            return acc;
        }, {} as Record<ModelProvider, Array<{ key: ModelKey } & NonNullable<(typeof modelInfo)[ModelKey]>>>);
    }, []);

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
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="gap-1 rounded-md px-3 h-10 text-lg justify-between"
                            >
                                {getModelDisplayName(selectedModel)}
                                <ChevronDownIcon className="w-4 h-4 text-muted-foreground ml-2 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Search model..."
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>No model found.</CommandEmpty>
                                    {Object.entries(groupedModels).map(
                                        ([provider, models], index) => (
                                            <CommandGroup
                                                key={provider}
                                                heading={provider}
                                            >
                                                {index > 0 && (
                                                    <CommandSeparator />
                                                )}
                                                {models.map((model) => {
                                                    const Icon = model.icon;
                                                    return (
                                                        <CommandItem
                                                            key={model.key}
                                                            onSelect={() => {
                                                                handleModelChange(
                                                                    model.key
                                                                );
                                                                setOpen(false);
                                                            }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Icon className="w-4 h-4 shrink-0" />
                                                            <div>
                                                                <div className="font-medium">
                                                                    {model.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {
                                                                        model.description
                                                                    }
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        )
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
