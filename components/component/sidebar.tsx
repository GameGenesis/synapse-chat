import React from "react";
import { Button } from "@/components/ui/button";
import { NewChatIcon } from "./icons";

interface SidebarProps {
    onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat }) => {
    return (
        <div className="flex flex-col h-full bg-background mt-2">
            <div className="p-4 border-b">
                <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={onNewChat}
                >
                    <NewChatIcon className="mr-2 h-5 w-5" />
                    New chat
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {/* Add your chat history or other sidebar content here */}
                <div className="text-sm text-muted-foreground">
                    Chat history will appear here
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
