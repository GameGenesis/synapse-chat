import React, { useRef, useEffect, useState } from "react";
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

interface Prompt {
    icon: React.ElementType;
    displayName: string;
    prompt: string;
    color: string;
}

const allPrompts: Prompt[] = [
    {
        icon: PaperAirplaneIcon,
        displayName: "Email for plumber quote",
        prompt: "Write an email to request a quote from a plumber for fixing a leaky faucet.",
        color: "bg-blue-100 text-blue-600"
    },
    {
        icon: LightBulbIcon,
        displayName: "Activities to make friends in new city",
        prompt: "Suggest activities or ways to make new friends after moving to a new city.",
        color: "bg-yellow-100 text-yellow-600"
    },
    {
        icon: AcademicCapIcon,
        displayName: "Study vocabulary",
        prompt: "Create a list of 10 advanced English vocabulary words with their definitions and example sentences.",
        color: "bg-green-100 text-green-600"
    },
    {
        icon: SunIcon,
        displayName: "Plan a relaxing day",
        prompt: "Help me plan a relaxing day off, including activities for self-care and stress relief.",
        color: "bg-orange-100 text-orange-600"
    },
    {
        icon: BriefcaseIcon,
        displayName: "Prepare for job interview",
        prompt: "Give me tips on how to prepare for a software developer job interview.",
        color: "bg-purple-100 text-purple-600"
    },
    {
        icon: CodeBracketIcon,
        displayName: "Explain a coding concept",
        prompt: "Explain the concept of recursion in programming with a simple example.",
        color: "bg-indigo-100 text-indigo-600"
    },
    {
        icon: PencilIcon,
        displayName: "Creative writing prompt",
        prompt: "Give me a creative writing prompt for a short story about time travel.",
        color: "bg-pink-100 text-pink-600"
    },
    {
        icon: GlobeAltIcon,
        displayName: "Plan a trip",
        prompt: "Help me plan a 7-day trip to Japan, including must-visit places and local cuisine to try.",
        color: "bg-teal-100 text-teal-600"
    },
    {
        icon: CalculatorIcon,
        displayName: "Solve a math problem",
        prompt: "Can you help me solve this calculus problem: Find the derivative of f(x) = x^3 + 2x^2 - 5x + 3.",
        color: "bg-red-100 text-red-600"
    },
    {
        icon: BeakerIcon,
        displayName: "Explain a scientific concept",
        prompt: "Explain the concept of quantum entanglement in simple terms.",
        color: "bg-cyan-100 text-cyan-600"
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
        setInput(prompt);
        if (formRef.current) {
            setTimeout(() => formRef.current?.requestSubmit(), 0);
        }
    };

    if (randomPrompts.length === 0) {
        return null;
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">
                    Choose a prompt to get started
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {randomPrompts.map((item, index) => (
                        <button
                            key={index}
                            className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 text-center h-full"
                            onClick={() => handlePromptSelect(item.prompt)}
                        >
                            <div
                                className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center ${item.color}`}
                            >
                                <item.icon className={`w-6 h-6`} />
                            </div>
                            <span className="text-sm text-gray-700 line-clamp-2">
                                {item.displayName}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="hidden">
                <input type="submit" />
            </form>
        </>
    );
};

export default DefaultPrompts;
