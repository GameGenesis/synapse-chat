import { Button } from "@/components/ui";
import { ChatRequestOptions, CreateMessage, generateId, Message } from "ai";
import { FastForwardIcon } from "lucide-react";

interface Props {
    show: boolean;
    onHide: () => void;
    appendMessage: (
        message: Message | CreateMessage,
        chatRequestOptions?: ChatRequestOptions | undefined
    ) => Promise<string | null | undefined>;
}

const ContinueButton = ({ show, onHide, appendMessage }: Props) => {
    if (!show) return null;

    const handleContinueResponse = () => {
        appendMessage({
            id: generateId(),
            role: "system",
            content: "Continue Response"
        });
        onHide();
    };

    return (
        <div className="fixed bottom-20 left-4 z-10">
            <Button
                onClick={handleContinueResponse}
                className="flex items-center space-x-2 shadow-lg"
            >
                <FastForwardIcon className="w-5 h-5" />
                <span>Continue Response</span>
            </Button>
        </div>
    );
};

export default ContinueButton;
