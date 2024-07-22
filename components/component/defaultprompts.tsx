import React, { useRef } from "react";
import { useEffect, useState } from "react";
import {
    PaperAirplaneIcon,
    LightBulbIcon,
    AcademicCapIcon,
    SunIcon,
    BriefcaseIcon,
    CodeBracketIcon,
    PencilIcon,
    GlobeAltIcon,
    CalculatorIcon,
    BeakerIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

interface Prompt {
    icon: React.ElementType;
    displayName: string;
    prompt: string;
}

const allPrompts: Prompt[] = [
    {
        icon: PaperAirplaneIcon,
        displayName: "Email for plumber quote",
        prompt: "Write an email to request a quote from a plumber for fixing a leaky faucet."
    },
    {
        icon: LightBulbIcon,
        displayName: "Activities to make friends in new city",
        prompt: "Suggest activities or ways to make new friends after moving to a new city."
    },
    {
        icon: AcademicCapIcon,
        displayName: "Study vocabulary",
        prompt: "Create a list of 10 advanced English vocabulary words with their definitions and example sentences."
    },
    {
        icon: SunIcon,
        displayName: "Plan a relaxing day",
        prompt: "Help me plan a relaxing day off, including activities for self-care and stress relief."
    },
    {
        icon: BriefcaseIcon,
        displayName: "Prepare for job interview",
        prompt: "Give me tips on how to prepare for a software developer job interview."
    },
    {
        icon: CodeBracketIcon,
        displayName: "Explain a coding concept",
        prompt: "Explain the concept of recursion in programming with a simple example."
    },
    {
        icon: PencilIcon,
        displayName: "Creative writing prompt",
        prompt: "Give me a creative writing prompt for a short story about time travel."
    },
    {
        icon: GlobeAltIcon,
        displayName: "Plan a trip",
        prompt: "Help me plan a 7-day trip to Japan, including must-visit places and local cuisine to try."
    },
    {
        icon: CalculatorIcon,
        displayName: "Solve a math problem",
        prompt: "Can you help me solve this calculus problem: Find the derivative of f(x) = x^3 + 2x^2 - 5x + 3."
    },
    {
        icon: BeakerIcon,
        displayName: "Explain a scientific concept",
        prompt: "Explain the concept of quantum entanglement in simple terms."
    }
];

interface DefaultPromptsProps {
    setInput: (value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const DefaultPrompts: React.FC<DefaultPromptsProps> = ({
    setInput,
    handleSubmit
}) => {
    const [randomPrompts, setRandomPrompts] = useState<Prompt[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
        setRandomPrompts(shuffled.slice(0, 4));
    }, []);

    const handlePromptSelect = (prompt: string) => {
        // Create a synthetic event to update the input
        setInput(prompt);

        // Submit the form
        if (formRef.current) {
            setTimeout(() => formRef.current?.requestSubmit(), 0);
        }
    };

    if (randomPrompts.length === 0) {
        return null;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto p-4">
                {randomPrompts.map((item, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        className="flex items-center p-4 text-left"
                        onClick={() => handlePromptSelect(item.prompt)}
                    >
                        <item.icon className="w-6 h-6 mr-3 text-gray-500" />
                        <span className="text-sm text-gray-700">
                            {item.displayName}
                        </span>
                    </Button>
                ))}
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="hidden">
                <input type="submit" />
            </form>
        </>
    );
};

export default DefaultPrompts;
