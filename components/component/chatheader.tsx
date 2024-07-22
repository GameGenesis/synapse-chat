"use client";

import { useState } from "react";
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
import { LayoutPanelLeftIcon, SettingsIcon } from "lucide-react";
import { MenuIcon, SparkleIcon, ZapIcon } from "./icons";
import { ModelKey } from "@/app/api/chat/model-provider";

interface Props {
    artifacts: boolean;
    isArtifactsOpen: boolean;
    setIsArtifactsOpen: (open: boolean) => void;
    selectedModel: ModelKey;
    onModelSelect: (model: ModelKey) => void;
    onOpenSettings: () => void;
}

const modelInfo: Partial<
    Record<
        ModelKey,
        {
            name: string;
            description: string;
            icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        }
    >
> = {
    gpt4o: {
        name: "GPT-4o",
        description: "Most capable GPT-4 model for a wide range of tasks.",
        icon: SparkleIcon
    },
    claude35sonnet: {
        name: "Claude 3.5 Sonnet",
        description:
            "Anthropic's latest model, great for various applications.",
        icon: SparkleIcon
    },
    gpt4omini: {
        name: "GPT-4o Mini",
        description: "Fast and efficient for most everyday tasks.",
        icon: ZapIcon
    }
};

const ChatHeader = ({
    artifacts,
    isArtifactsOpen,
    setIsArtifactsOpen,
    selectedModel,
    onModelSelect: onModelChange,
    onOpenSettings
}: Props) => {
    const handleModelChange = (model: ModelKey) => {
        onModelChange(model);
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
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                            >
                                <MenuIcon className="w-6 h-6" />
                                <span className="sr-only">
                                    Toggle navigation
                                </span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <div className="grid gap-2 py-6" />
                        </SheetContent>
                    </Sheet>
                </div>
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="gap-1 rounded-xl px-3 h-10 data-[state=open]:bg-muted text-lg"
                            >
                                {getModelDisplayName(selectedModel)}
                                <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="max-w-[300px]"
                        >
                            {(Object.keys(modelInfo) as ModelKey[]).map(
                                (modelKey, index) => {
                                    const Icon = getModelIcon(modelKey);
                                    return (
                                        <div key={modelKey}>
                                            {index > 0 && (
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
                    >
                        <SettingsIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
