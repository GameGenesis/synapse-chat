import React, { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlusIcon, MessageSquare } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Chat {
    _id: string;
    name: string;
    updatedAt: string;
    lastMessage: string;
}

interface SidebarProps {
    userId: string;
}

const Sidebar = ({ userId }: SidebarProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(`/api/chats?userId=${userId}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || "Failed to fetch chats");
                }

                setChats(data.chats);
            } catch (error) {
                console.error("Failed to fetch chats:", error);
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch chats"
                );
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchChats();
        }
    }, [userId]);

    const truncateText = (text: string, maxLength: number = 28) => {
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffInDays === 0) {
            return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });
        } else if (diffInDays === 1) {
            return "Yesterday";
        } else if (diffInDays < 7) {
            return date.toLocaleDateString("en-US", { weekday: "short" });
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b">
                <Button
                    variant="outline"
                    className="w-full justify-start hover:bg-accent hover:text-accent-foreground"
                    onClick={() => router.push("/chat")}
                >
                    <MessageSquarePlusIcon className="mr-2 h-5 w-5" />
                    New chat
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2">
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-14 bg-muted animate-pulse rounded-lg"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-sm text-destructive p-4 text-center">
                        {error}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">
                        No chat history yet
                    </div>
                ) : (
                    <div className="space-y-1">
                        {chats.map((chat) => (
                            <Button
                                key={chat._id}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start px-3 py-4 h-auto",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "transition-colors duration-200",
                                    pathname?.includes(chat._id) &&
                                        "bg-accent text-accent-foreground"
                                )}
                                onClick={() => router.push(`/chat/${chat._id}`)}
                            >
                                <div className="flex items-start w-full">
                                    <MessageSquare className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col items-start overflow-hidden w-full">
                                        <div className="flex justify-between w-full">
                                            <span className="text-sm font-medium truncate flex-1">
                                                {truncateText(chat.name)}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                                {formatDate(chat.updatedAt)}
                                            </span>
                                        </div>
                                        {chat.lastMessage && (
                                            <span className="text-xs text-muted-foreground truncate w-full">
                                                {truncateText(
                                                    chat.lastMessage,
                                                    40
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(Sidebar);
