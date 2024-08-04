import { CombinedMessage, State } from "@/lib/types";
import toast from "react-hot-toast";

const saveChat = async (
    chatId: string | null,
    messages: CombinedMessage[],
    settings: State,
    setIsSaving?: (value: boolean) => void
) => {
    if (setIsSaving) {
        setIsSaving(true);
    }

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chatId,
                messages,
                settings
            })
        });
        const data = await response.json();

        if (data.chatId) {
            return data.chatId;
        }
    } catch (error) {
        toast.error("Error saving chat");
        console.log("Error saving chat:", error);
    } finally {
        if (setIsSaving) {
            setIsSaving(false);
        }
    }
};

export default saveChat;
