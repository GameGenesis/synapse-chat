import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const Sidebar = () => {
    const router = useRouter();
    return (
        <div className="flex flex-col h-full bg-background mt-2">
            <div className="p-4 border-b">
                <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/chat")}
                >
                    <MessageSquarePlusIcon className="mr-2 h-5 w-5" />
                    New chat
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
