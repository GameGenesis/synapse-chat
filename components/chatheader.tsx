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
    CalculatorIcon,
    GaugeIcon,
    LayoutPanelLeftIcon,
    LightbulbIcon,
    MessageSquarePlusIcon,
    MessageSquareTextIcon,
    MessagesSquareIcon,
    SettingsIcon,
    SparklesIcon,
    WrenchIcon,
    FileStackIcon,
    PanelLeftIcon,
    PanelRightIcon,
    ShapesIcon,
    GroupIcon,
    FishIcon,
    FishSymbolIcon
} from "lucide-react";
import { AutoIcon, SparkleIcon, ZapIcon } from "./icons";
import { ModelKey, ModelProvider } from "@/lib/utils/model-provider";
import { useMemo, useState } from "react";
import { redirect } from "next/navigation";

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
            "Anthropic's latest and most intelligent model, great for various applications.",
        icon: SparklesIcon,
        provider: ModelProvider.Anthropic
    },
    claude3opus: {
        name: "Claude 3 Opus",
        description: "Powerful Anthropic model for highly complex tasks.",
        icon: LightbulbIcon,
        provider: ModelProvider.Anthropic
    },
    claude35haiku: {
        name: "Claude 3.5 Haiku",
        description: "Fastest Anthropic model for near-instant responses.",
        icon: ZapIcon,
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
        name: "GPT-4o mini",
        description: "Fast and efficient for most everyday tasks.",
        icon: ZapIcon,
        provider: ModelProvider.OpenAI
    },
    o1preview: {
        name: "o1-preview",
        description:
            "Reasoning model designed to solve hard problems across domains.",
        icon: ShapesIcon,
        provider: ModelProvider.OpenAI
    },
    o1mini: {
        name: "o1-mini",
        description:
            "Faster and cheaper reasoning model particularly good at coding, math, and science.",
        icon: GroupIcon,
        provider: ModelProvider.OpenAI
    },
    // o3mini: {
    //     name: "o3-mini",
    //     description:
    //         "Most recent small OpenAI reasoning model, providing high intelligence at the same cost and latency targets of o1-mini.",
    //     icon: GroupIcon,
    //     provider: ModelProvider.OpenAI
    // },
    deepseek_r1_distill_llama_70b: {
        name: "DeepSeek R1 (Distill Llama 70B)",
        description:
            "Frontier thinking model by DeepSeek, distilled and hosted by Meta on Groq.",
        icon: FishIcon,
        provider: ModelProvider.Groq
    },
    deepseek_r1_distill_qwen_32b: {
        name: "DeepSeek R1 (Distill Qwen 32B)",
        description:
            "Frontier thinking model by DeepSeek, distilled and hosted by Alibaba on Groq.",
        icon: FishSymbolIcon,
        provider: ModelProvider.Groq
    },
    llama33_70b_specdec: {
        name: "Llama 3.3 70B Specdec",
        description:
            "Llama model from Groq specifically designed with speed in mind (Speculative Decoding).",
        icon: WrenchIcon,
        provider: ModelProvider.Groq
    },
    llama33_70b_versatile: {
        name: "Llama 3.3 70B Versatile",
        description:
            "Capable and versatile open source model from Meta using Groq.",
        icon: BookOpenIcon,
        provider: ModelProvider.Groq
    },
    llama32_90b_vision: {
        name: "Llama 3.2 90B Vision",
        description:
            "Multi-modal open source model with image reasoning from Meta using Groq.",
        icon: FileStackIcon,
        provider: ModelProvider.Groq
    },
    llama31_8b: {
        name: "Llama 3.1 8B",
        description:
            "Instant responses from Llama 3.1 8B using Groq LPU AI inference.",
        icon: GaugeIcon,
        provider: ModelProvider.Groq
    },
    mixtral_8x7b: {
        name: "Mixtral 8x7B (Groq)",
        description: "Open source Mixtral of experts model from Mistral AI.",
        icon: BlendIcon,
        provider: ModelProvider.Groq
    },
    mathgpt: {
        name: "MathGPT",
        description:
            "Custom GPT-4o mini model that excels at advanced math questions.",
        icon: CalculatorIcon,
        provider: ModelProvider.Other
    },
    reasoning: {
        name: "Reasoning",
        description: "Custom Reasoning Model.",
        icon: ShapesIcon,
        provider: ModelProvider.Other
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

interface Props {
    artifacts: boolean;
    isArtifactsOpen: boolean;
    setIsArtifactsOpen: (open: boolean) => void;
    selectedModel: ModelKey;
    onModelSelect: (model: ModelKey) => void;
    onOpenSettings: () => void;
    isSidebarOpen: boolean;
    onSidebarOpenChange: (open: boolean) => void;
}

const ChatHeader = ({
    artifacts,
    isArtifactsOpen,
    setIsArtifactsOpen,
    selectedModel,
    onModelSelect,
    onOpenSettings,
    isSidebarOpen,
    onSidebarOpenChange
}: Props) => {
    const [open, setOpen] = useState(false);

    const handleModelChange = (model: ModelKey) => {
        onModelSelect(model);
    };

    const getModelDisplayName = (modelKey: ModelKey) => {
        return modelInfo[modelKey]?.name;
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
                    <Button
                        variant="default"
                        size="icon"
                        onClick={() => onSidebarOpenChange(!isSidebarOpen)}
                        aria-label={
                            isSidebarOpen ? "Close sidebar" : "Open sidebar"
                        }
                    >
                        {isSidebarOpen ? (
                            <PanelLeftIcon className="h-5 w-5" />
                        ) : (
                            <PanelRightIcon className="h-5 w-5" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Open new chat"
                        onClick={() => redirect("/chat")} // or just redirect to "/"
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
