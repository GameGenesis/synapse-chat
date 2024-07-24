import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { ModelKey } from "@/app/api/chat/model-provider";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    selectedModel: ModelKey;
    temperature: number;
    setTemperature: (value: number) => void;
    maxTokens: number;
    setMaxTokens: React.Dispatch<React.SetStateAction<number>>;
    enableArtifacts: boolean;
    setEnableArtifacts: (value: boolean) => void;
    enableInstructions: boolean;
    setEnableInstructions: (value: boolean) => void;
    enableSafeguards: boolean;
    setEnableSafeguards: (value: boolean) => void;
    enableTools: boolean;
    setEnableTools: (value: boolean) => void;
    customInstructions: string;
    setCustomInstructions: (value: string) => void;
}

export function SettingsMenu({
    isOpen,
    onClose,
    selectedModel,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    enableArtifacts,
    setEnableArtifacts,
    enableInstructions,
    setEnableInstructions,
    enableSafeguards,
    setEnableSafeguards,
    enableTools,
    setEnableTools,
    customInstructions,
    setCustomInstructions
}: Props) {
    const [maxPossibleOutput, setMaxPossibleOutput] = useState(4096);
    useEffect(() => {
        const newMaxPossibleOutput =
            selectedModel === "gpt4omini" ? 16384 : 4096;
        setMaxPossibleOutput(newMaxPossibleOutput);
        setMaxTokens((prevMaxTokens) =>
            Math.min(prevMaxTokens, newMaxPossibleOutput)
        );
    }, [selectedModel, setMaxTokens]);

    const handleSetMaxTokens = (value: number) => {
        setMaxTokens(Math.min(Math.max(1, value), maxPossibleOutput));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Adjust the AI model and conversation parameters.
                    </DialogDescription>
                </DialogHeader>
                <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue="model-parameters"
                >
                    <AccordionItem value="model-parameters">
                        <AccordionTrigger>Model Parameters</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-4">
                                    <Label
                                        htmlFor="temperature"
                                        className="w-36"
                                    >
                                        Temperature
                                    </Label>
                                    <Slider
                                        id="temperature"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={[temperature]}
                                        onValueChange={(value) =>
                                            setTemperature(value[0])
                                        }
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        value={temperature}
                                        onChange={(e) =>
                                            setTemperature(
                                                Number(e.target.value)
                                            )
                                        }
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        className="w-20"
                                    />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Label htmlFor="maxTokens" className="w-36">
                                        Max Tokens
                                    </Label>
                                    <Slider
                                        id="maxTokens"
                                        min={1}
                                        max={maxPossibleOutput}
                                        step={1}
                                        value={[maxTokens]}
                                        onValueChange={(value) =>
                                            setMaxTokens(value[0])
                                        }
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        value={maxTokens}
                                        onChange={(e) =>
                                            handleSetMaxTokens(
                                                Number(e.target.value)
                                            )
                                        }
                                        min={1}
                                        max={maxPossibleOutput}
                                        step={1}
                                        className="w-20"
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="features">
                        <AccordionTrigger>Features</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enableArtifacts">
                                        Enable Artifacts
                                    </Label>
                                    <Switch
                                        id="enableArtifacts"
                                        checked={enableArtifacts}
                                        onCheckedChange={setEnableArtifacts}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enableInstructions">
                                        Enable Default Instructions
                                    </Label>
                                    <Switch
                                        id="enableInstructions"
                                        checked={enableInstructions}
                                        onCheckedChange={(checked) => {
                                            setEnableInstructions(checked);
                                            setEnableSafeguards(
                                                checked && enableSafeguards
                                            );
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enableSafeguards">
                                        Enable Safeguards
                                    </Label>
                                    <Switch
                                        id="enableSafeguards"
                                        checked={enableSafeguards}
                                        onCheckedChange={setEnableSafeguards}
                                        disabled={!enableInstructions}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="enableTools">
                                            Enable Tools
                                        </Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <InfoIcon className="h-4 w-4 text-gray-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        Available Tools:
                                                        DALLE-3, Bing, Weather,
                                                        Wikipedia, Calculator,
                                                        Time
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Switch
                                        id="enableTools"
                                        checked={enableTools}
                                        onCheckedChange={setEnableTools}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="custom-instructions">
                        <AccordionTrigger>Custom Instructions</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pt-2">
                                <div
                                    className={`p-1 bg-background rounded-md border relative group overflow-hidden ${
                                        customInstructions.length >= 3000
                                            ? "focus:border-red-500 focus-within:border-red-500"
                                            : "focus:border-primary focus-within:border-primary"
                                    }`}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-transparent transition-all duration-200 group-focus-within:h-[3px] group-focus:h-[3px]">
                                        <div
                                            className={`absolute inset-0 ${
                                                customInstructions.length >=
                                                3000
                                                    ? "bg-red-500"
                                                    : "bg-primary"
                                            }`}
                                            style={{ bottom: "-1px" }}
                                        />
                                    </div>
                                    <textarea
                                        id="customInstructions"
                                        value={customInstructions}
                                        onChange={(e) =>
                                            setCustomInstructions(
                                                e.target.value
                                            )
                                        }
                                        maxLength={3000}
                                        rows={4}
                                        placeholder="Enter your custom instructions"
                                        className="resize-none focus:border-none border-none outline-none w-full h-full p-2"
                                    />
                                    <div className="flex justify-end pr-1 pb-1 w-full">
                                        <span className="text-sm text-muted-foreground">
                                            {customInstructions.length}/3000
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </DialogContent>
        </Dialog>
    );
}
