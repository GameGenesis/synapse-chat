import React from "react";
import { memo, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SidebarSkeleton } from "./sidebarskeleton";

interface Chat {
    _id: string;
    name: string;
    updatedAt: string;
    lastMessage: string;
}

interface Props {
    userId: string;
}

const CHAT_ITEM_HEIGHT = 76; // Height of each chat item
const SCROLL_THRESHOLD = 100; // Pixels from bottom to trigger loading more

export const Sidebar = memo(function Sidebar({ userId }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const parentRef = React.useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: chats.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => CHAT_ITEM_HEIGHT,
        overscan: 5
    });

    const fetchChats = useCallback(
        async (pageNum: number) => {
            try {
                setError(null);
                const response = await fetch(
                    `/api/chats?userId=${userId}&page=${pageNum}&limit=20`
                );
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || "Failed to fetch chats");
                }

                setChats((prev) =>
                    pageNum === 1 ? data.chats : [...prev, ...data.chats]
                );
                setHasMore(data.chats.length === 20);
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
        },
        [userId]
    );

    useEffect(() => {
        if (userId) {
            fetchChats(1);
        }
    }, [userId, fetchChats]);

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            if (!hasMore || isLoading) return;

            const element = e.target as HTMLDivElement;
            const scrollBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight;

            if (scrollBottom < SCROLL_THRESHOLD) {
                setPage((prev) => {
                    const nextPage = prev + 1;
                    fetchChats(nextPage);
                    return nextPage;
                });
            }
        },
        [hasMore, isLoading, fetchChats]
    );

    const truncateText = useCallback((text: string, maxLength: number = 28) => {
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    }, []);

    const formatDate = useCallback((dateString: string) => {
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
    }, []);

    return (
        <div className="flex flex-col h-full bg-background">
            <div
                ref={parentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto py-2 px-2"
            >
                {isLoading && page === 1 ? (
                    <SidebarSkeleton />
                ) : error ? (
                    <div className="text-sm text-destructive p-4 text-center">
                        {error}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">
                        No chat history yet
                    </div>
                ) : (
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative"
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const chat = chats[virtualRow.index];
                            return (
                                <Button
                                    key={chat._id}
                                    variant="ghost"
                                    className={cn(
                                        "absolute top-0 left-0 w-full justify-start px-3 py-4 h-auto",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        "transition-colors duration-200",
                                        pathname?.includes(chat._id) &&
                                            "bg-accent text-accent-foreground"
                                    )}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`
                                    }}
                                    onClick={() =>
                                        router.push(`/chat/${chat._id}`)
                                    }
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
                            );
                        })}
                    </div>
                )}
                {isLoading && page > 1 && (
                    <div className="py-2">
                        <div className="h-[72px] bg-muted animate-pulse rounded-lg" />
                    </div>
                )}
            </div>
        </div>
    );
});
