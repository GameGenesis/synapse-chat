"use client";

import { Chat } from "@/components/chat";
import { generateId } from "ai";

export default function Page() {
    const userId = "1";
    const chatId = generateId();

    return <Chat userId={userId} chatId={chatId} />;
}
