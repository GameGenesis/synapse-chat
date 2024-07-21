import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    temperature: number;
    setTemperature: (value: number) => void;
    maxTokens: number;
    setMaxTokens: (value: number) => void;
    enableArtifacts: boolean;
    setEnableArtifacts: (value: boolean) => void;
    enableDefaultPrompt: boolean;
    setEnableDefaultPrompt: (value: boolean) => void;
    enableSafeguards: boolean;
    setEnableSafeguards: (value: boolean) => void;
    enableTools: boolean;
    setEnableTools: (value: boolean) => void;
    systemPrompt: string;
    setSystemPrompt: (value: string) => void;
}

export function SettingsMenu({
    isOpen,
    onClose,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    enableArtifacts,
    setEnableArtifacts,
    enableDefaultPrompt,
    setEnableDefaultPrompt,
    enableSafeguards,
    setEnableSafeguards,
    enableTools,
    setEnableTools,
    systemPrompt,
    setSystemPrompt
}: Props) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="temperature" className="text-right">
                            Temperature
                        </Label>
                        <Slider
                            id="temperature"
                            min={0}
                            max={1}
                            step={0.01}
                            value={[temperature]}
                            onValueChange={(value: any) =>
                                setTemperature(value[0])
                            }
                            className="col-span-2"
                        />
                        <Input
                            type="number"
                            value={temperature}
                            onChange={(e: any) =>
                                setTemperature(Number(e.target.value))
                            }
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxTokens" className="text-right">
                            Max Tokens
                        </Label>
                        <Slider
                            id="maxTokens"
                            min={1}
                            max={4096}
                            step={1}
                            value={[maxTokens]}
                            onValueChange={(value: any) =>
                                setMaxTokens(value[0])
                            }
                            className="col-span-2"
                        />
                        <Input
                            type="number"
                            value={maxTokens}
                            onChange={(e: any) =>
                                setMaxTokens(Number(e.target.value))
                            }
                            min={1}
                            max={4096}
                            step={1}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="enableArtifacts"
                            checked={enableArtifacts}
                            onCheckedChange={setEnableArtifacts}
                        />
                        <Label htmlFor="enableArtifacts">
                            Enable Artifacts
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="enableDefaultPrompt"
                            checked={enableDefaultPrompt}
                            onCheckedChange={(checked: boolean) => {
                                setEnableDefaultPrompt(checked);
                                setEnableSafeguards(
                                    checked && enableSafeguards
                                );
                            }}
                        />
                        <Label htmlFor="enableDefaultPrompt">
                            Enable Default System Prompt
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="enableSafeguards"
                            checked={enableSafeguards}
                            onCheckedChange={setEnableSafeguards}
                            disabled={!enableDefaultPrompt}
                        />
                        <Label htmlFor="enableSafeguards">
                            Enable Safeguards
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="enableTools"
                            checked={enableTools}
                            onCheckedChange={setEnableTools}
                        />
                        <Label htmlFor="enableTools">
                            Enable Tools (DALLE, Bing, Weather, Wikipedia,
                            Calculator, Time)
                        </Label>
                    </div>
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="systemPrompt">System Prompt</Label>
                        <Textarea
                            id="systemPrompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            maxLength={1000}
                            rows={4}
                            placeholder="Enter system prompt here..."
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
