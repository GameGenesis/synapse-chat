import { Chat } from "@/components/chat";
import { generateId } from "ai";

export const metadata = {
    title: "New Chat | Poe Chatbot"
};

export default function Page() {
    const id = generateId();

    return <Chat userId="1" chatId={id} />;
}
