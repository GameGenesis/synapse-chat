import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlusIcon } from "lucide-react";

const Sidebar = () => {
    return (
        <div className="flex flex-col h-full bg-background mt-2">
            <div className="p-4 border-b">
                <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                >
                    <a href="/">
                        <MessageSquarePlusIcon className="mr-2 h-5 w-5" />
                        New chat
                    </a>
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {/* Add chat history or other sidebar content here */}
                <div className="text-sm text-muted-foreground">
                    Chat history will appear here
                </div>
            </div>
        </div>
    );
};

export default memo(Sidebar);
