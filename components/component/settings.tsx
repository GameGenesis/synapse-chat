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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Action, State } from "@/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    state: State;
    dispatch: React.Dispatch<Action>;
}

export function SettingsMenu({ isOpen, onClose, state, dispatch }: Props) {
    const [maxPossibleOutput, setMaxPossibleOutput] = useState(4096);

    useEffect(() => {
        const newMaxPossibleOutput = state.model === "gpt4omini" ? 16384 : 4096;
        setMaxPossibleOutput(newMaxPossibleOutput);
        dispatch({
            type: "SET_MAX_TOKENS",
            payload: Math.min(state.maxTokens, newMaxPossibleOutput)
        });
    }, [state.model, state.maxTokens, dispatch]);

    const handleSetMaxTokens = (value: number) => {
        dispatch({
            type: "SET_MAX_TOKENS",
            payload: Math.min(Math.max(1, value), maxPossibleOutput)
        });
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
                            <div className="space-y-2 p-1">
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
                                        value={[state.temperature]}
                                        onValueChange={(value) =>
                                            dispatch({
                                                type: "SET_TEMPERATURE",
                                                payload: value[0]
                                            })
                                        }
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        value={state.temperature}
                                        onChange={(e) =>
                                            dispatch({
                                                type: "SET_TEMPERATURE",
                                                payload: Number(e.target.value)
                                            })
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
                                        value={[state.maxTokens]}
                                        onValueChange={(value) =>
                                            handleSetMaxTokens(value[0])
                                        }
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        value={state.maxTokens}
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
                                <div className="flex items-center space-x-4">
                                    <Label htmlFor="topP" className="w-36">
                                        Top P
                                    </Label>
                                    <Slider
                                        id="topP"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={[state.topP]}
                                        onValueChange={(value) =>
                                            dispatch({
                                                type: "SET_TOP_P",
                                                payload: value[0]
                                            })
                                        }
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        value={state.topP}
                                        onChange={(e) =>
                                            dispatch({
                                                type: "SET_TOP_P",
                                                payload: Number(e.target.value)
                                            })
                                        }
                                        min={0}
                                        max={1}
                                        step={0.01}
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
                                        checked={state.enableArtifacts}
                                        onCheckedChange={(checked) =>
                                            dispatch({
                                                type: "SET_ENABLE_ARTIFACTS",
                                                payload: checked
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enableInstructions">
                                        Enable Default Instructions
                                    </Label>
                                    <Switch
                                        id="enableInstructions"
                                        checked={state.enableInstructions}
                                        onCheckedChange={(checked) => {
                                            dispatch({
                                                type: "SET_ENABLE_INSTRUCTIONS",
                                                payload: checked
                                            });
                                            if (!checked) {
                                                dispatch({
                                                    type: "SET_ENABLE_SAFEGUARDS",
                                                    payload: false
                                                });
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enableSafeguards">
                                        Enable Additional Safeguards
                                    </Label>
                                    <Switch
                                        id="enableSafeguards"
                                        checked={state.enableSafeguards}
                                        onCheckedChange={(checked) =>
                                            dispatch({
                                                type: "SET_ENABLE_SAFEGUARDS",
                                                payload: checked
                                            })
                                        }
                                        disabled={!state.enableInstructions}
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
                                        checked={state.enableTools}
                                        onCheckedChange={(checked) =>
                                            dispatch({
                                                type: "SET_ENABLE_TOOLS",
                                                payload: checked
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="enablePasteToFile">
                                            Enable Paste to File
                                        </Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <InfoIcon className="h-4 w-4 text-gray-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        Pastes long-form text as
                                                        a plaintext file
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Switch
                                        id="enablePasteToFile"
                                        checked={state.enablePasteToFile}
                                        onCheckedChange={(checked) =>
                                            dispatch({
                                                type: "SET_ENABLE_PASTE_TO_FILE",
                                                payload: checked
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="custom-instructions">
                        <AccordionTrigger>Custom Instructions</AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-2">
                                <div
                                    className={`p-1 bg-background rounded-md border relative group overflow-hidden ${
                                        state.customInstructions.length >= 3000
                                            ? "focus:border-red-500 focus-within:border-red-500"
                                            : "focus:border-primary focus-within:border-primary"
                                    }`}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-transparent transition-all duration-200 group-focus-within:h-[3px] group-focus:h-[3px]">
                                        <div
                                            className={`absolute inset-0 ${
                                                state.customInstructions
                                                    .length >= 3000
                                                    ? "bg-red-500"
                                                    : "bg-primary"
                                            }`}
                                            style={{ bottom: "-1px" }}
                                        />
                                    </div>
                                    <textarea
                                        id="customInstructions"
                                        value={state.customInstructions}
                                        onChange={(e) =>
                                            dispatch({
                                                type: "SET_CUSTOM_INSTRUCTIONS",
                                                payload: e.target.value
                                            })
                                        }
                                        maxLength={3000}
                                        rows={4}
                                        placeholder="Enter your custom instructions"
                                        className="resize-none focus:border-none border-none outline-none w-full h-full p-2"
                                    />
                                    <div className="flex justify-end pr-1 pb-1 w-full">
                                        <span className="text-sm text-muted-foreground">
                                            {state.customInstructions.length}
                                            /3000
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
