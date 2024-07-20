"use client";

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
import { LayoutPanelLeftIcon } from "lucide-react";
import { MenuIcon, SparkleIcon, ZapIcon } from "./icons";

interface Props {
    isArtifactsWindowOpen: boolean;
    setIsArtifactsWindowOpen: (open: boolean) => void;
}

const ChatHeader = ({
    isArtifactsWindowOpen,
    setIsArtifactsWindowOpen
}: Props) => {
    return (
        <header className="flex w-full bg-background text-foreground py-3 px-4 md:px-6 border-b">
            <div className="flex container items-center justify-between">
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
                                ChatGPT{" "}
                                <span className="text-muted-foreground">
                                    3.5
                                </span>
                                <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="max-w-[300px]"
                        >
                            <DropdownMenuItem className="items-start gap-2">
                                <SparkleIcon className="w-4 h-4 mr-2 translate-y-1 shrink-0" />
                                <div>
                                    <div className="font-medium">GPT-4</div>
                                    <div className="text-muted-foreground/80">
                                        With DALL-E, browsing, and analysis.
                                        Limit 40 messages / 3 hours
                                    </div>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="items-start gap-2">
                                <ZapIcon className="w-4 h-4 mr-2 translate-y-1 shrink-0" />
                                <div>
                                    <div className="font-medium">GPT-3.5</div>
                                    <div className="text-muted-foreground/80">
                                        Great for everyday tasks
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-4">
                    {!isArtifactsWindowOpen && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsArtifactsWindowOpen(true)}
                            className="ml-auto"
                        >
                            <LayoutPanelLeftIcon className="w-4 h-4 mr-2" />
                            Open Artifacts
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
