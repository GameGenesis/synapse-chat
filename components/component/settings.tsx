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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Action, State, ToolChoice } from "@/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InfoIcon, Check, ChevronsUpDown } from "lucide-react";
import { tools } from "@/app/api/chat/config";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    state: State;
    dispatch: React.Dispatch<Action>;
}

export function SettingsMenu({ isOpen, onClose, state, dispatch }: Props) {
    const [maxPossibleOutput, setMaxPossibleOutput] = useState(4096);
    const [toolChoice, setToolChoice] = useState<ToolChoice>("auto");
    const [openCombobox, setOpenCombobox] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string>(
        typeof state.toolChoice === "object" ? state.toolChoice.toolName : ""
    );

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

    const handleToolChoiceChange = (value: string) => {
        if (value === "specific") {
            const newToolChoice: ToolChoice = {
                type: "tool",
                toolName: selectedTool || tools[0]
            };
            setToolChoice(newToolChoice);
            dispatch({ type: "SET_TOOL_CHOICE", payload: newToolChoice });
        } else {
            setToolChoice(value as ToolChoice);
            dispatch({ type: "SET_TOOL_CHOICE", payload: value as ToolChoice });
        }
    };

    const handleSpecificToolChange = (tool: string) => {
        setSelectedTool(tool);
        const newToolChoice: ToolChoice = { type: "tool", toolName: tool };
        setToolChoice(newToolChoice);
        dispatch({ type: "SET_TOOL_CHOICE", payload: newToolChoice });
        setOpenCombobox(false);
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
                    <AccordionItem value="tools">
                        <AccordionTrigger>Tools</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 p-1">
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="toolChoice">
                                        Tool Choice Mode
                                    </Label>
                                    <Select
                                        onValueChange={handleToolChoiceChange}
                                        value={
                                            typeof toolChoice === "string"
                                                ? toolChoice
                                                : "specific"
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select tool choice" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">
                                                Auto
                                            </SelectItem>
                                            <SelectItem value="required">
                                                Required
                                            </SelectItem>
                                            <SelectItem value="none">
                                                None
                                            </SelectItem>
                                            <SelectItem value="specific">
                                                Specific Tool
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {typeof toolChoice === "object" &&
                                    toolChoice.type === "tool" && (
                                        <div className="flex flex-col space-y-2">
                                            <Label htmlFor="specificTool">
                                                Specific Tool
                                            </Label>
                                            <Popover
                                                open={openCombobox}
                                                onOpenChange={setOpenCombobox}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={
                                                            openCombobox
                                                        }
                                                        className="w-full justify-between"
                                                    >
                                                        {selectedTool ||
                                                            "Select tool..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search tool..." />
                                                        <CommandEmpty>
                                                            No tool found.
                                                        </CommandEmpty>
                                                        <CommandList>
                                                            <CommandGroup>
                                                                {tools.map(
                                                                    (tool) => (
                                                                        <CommandItem
                                                                            key={
                                                                                tool
                                                                            }
                                                                            value={
                                                                                tool
                                                                            }
                                                                            onSelect={() => {
                                                                                handleSpecificToolChange(
                                                                                    tool
                                                                                );
                                                                                setOpenCombobox(
                                                                                    false
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    selectedTool ===
                                                                                        tool
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {
                                                                                tool
                                                                            }
                                                                        </CommandItem>
                                                                    )
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="custom-instructions">
                        <AccordionTrigger>Custom Instructions</AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-1">
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
