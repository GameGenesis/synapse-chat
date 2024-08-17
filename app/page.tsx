"use client";

import { Chat } from "@/components/chat";
import { generateId } from "ai";

export default function Page() {
    const id = generateId();

    return (
        <>
            <Chat userId="1" chatId={id} />
        </>
    );
}
