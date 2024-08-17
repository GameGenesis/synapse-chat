"use client";

import { Chat } from "@/components/chat";

export default function Page({ params }: { params: { id: string } }) {
    return (
        <>
            <Chat userId="1" chatId={params.id} />
        </>
    );
}
