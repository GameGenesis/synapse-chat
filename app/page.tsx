"use client";

import { Chat } from "@/components/component/chat";
import { Toaster } from "react-hot-toast";

export default function Page() {
    return (
        <>
            <Toaster position="top-center" />
            <Chat />
        </>
    );
}
