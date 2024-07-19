"use client";

import { useChat } from "ai/react";
import { Chat } from "@/components/component/chat";

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
        <Chat
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            data={data}
        />
    );
}
