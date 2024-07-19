"use client";

import { useChat } from "ai/react";
import { Chat } from "@/components/component/chat";
import { LiveProvider } from "react-live";

export default function Page() {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        data
    } = useChat();

    return (
        <LiveProvider>
            <Chat
                messages={messages}
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                data={data}
            />
        </LiveProvider>
    );
}
