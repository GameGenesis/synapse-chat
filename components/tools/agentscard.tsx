import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    UsersIcon,
    BrainIcon,
    CheckCircleIcon,
    AlertCircleIcon
} from "lucide-react";

interface AgentMessage {
    agent: string;
    content: any;
    type: "task" | "result" | "review";
}

interface AgentsCardProps {
    messages: AgentMessage[];
    status: string;
}

const AgentsCard: React.FC<AgentsCardProps> = ({ messages, status }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
        new Set()
    );

    const toggleMessageExpansion = (index: number) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedMessages(newExpanded);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "task":
                return <BrainIcon className="w-4 h-4" />;
            case "result":
                return <CheckCircleIcon className="w-4 h-4" />;
            case "review":
                return <AlertCircleIcon className="w-4 h-4" />;
            default:
                return <UsersIcon className="w-4 h-4" />;
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "task":
                return "bg-blue-100 text-blue-800";
            case "result":
                return "bg-green-100 text-green-800";
            case "review":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatContent = (content: any) => {
        if (typeof content === "string") {
            return content;
        }
        if (typeof content === "object") {
            // Handle taskList specifically
            if (content.taskList && Array.isArray(content.taskList)) {
                return content.taskList.map((task: any, index: number) => (
                    <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                        <p className="font-medium text-sm">
                            Agent: {task.agent}
                        </p>
                        <p className="text-sm text-gray-600">
                            {task.instructions}
                        </p>
                    </div>
                ));
            }
            // Handle other object types
            if (content.output) {
                return content.output;
            }
            if (content.innerThinking && content.output) {
                return (
                    <div>
                        <div className="mb-2">
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Thinking:
                            </p>
                            <p className="text-sm text-gray-500 italic">
                                {content.innerThinking}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                                Output:
                            </p>
                            <p className="text-sm">{content.output}</p>
                        </div>
                    </div>
                );
            }
            return JSON.stringify(content, null, 2);
        }
        return String(content);
    };

    const getTruncatedContent = (content: any, maxLength: number = 5000) => {
        const formatted = formatContent(content);
        if (typeof formatted === "string") {
            return formatted.length > maxLength
                ? formatted.substring(0, maxLength) + "..."
                : formatted;
        }
        return formatted;
    };

    const visibleMessages = isExpanded ? messages : messages.slice(0, 3);
    const isSuccessful = status.includes("Success");

    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="bg-purple-100 rounded-full p-2">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">
                                Agent Collaboration
                            </h3>
                            <p className="text-sm text-gray-500">
                                {messages.length} message
                                {messages.length !== 1 ? "s" : ""} from{" "}
                                {new Set(messages.map((m) => m.agent)).size}{" "}
                                agent
                                {new Set(messages.map((m) => m.agent)).size !==
                                1
                                    ? "s"
                                    : ""}
                            </p>
                        </div>
                    </div>
                    <Badge
                        className={
                            isSuccessful
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }
                    >
                        {isSuccessful ? "Success" : "Error"}
                    </Badge>
                </div>

                <div className="space-y-3">
                    {visibleMessages.map((message, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-3 bg-gray-50"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    {getTypeIcon(message.type)}
                                    <span className="font-medium text-sm">
                                        {message.agent}
                                    </span>
                                    <Badge
                                        className={`text-xs ${getTypeBadgeColor(
                                            message.type
                                        )}`}
                                    >
                                        {message.type}
                                    </Badge>
                                </div>
                                {typeof message.content === "string" &&
                                    message.content.length > 200 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                toggleMessageExpansion(index)
                                            }
                                            className="h-6 px-2"
                                        >
                                            {expandedMessages.has(index) ? (
                                                <ChevronUpIcon className="w-3 h-3" />
                                            ) : (
                                                <ChevronDownIcon className="w-3 h-3" />
                                            )}
                                        </Button>
                                    )}
                            </div>
                            <div className="text-sm text-gray-700">
                                {expandedMessages.has(index)
                                    ? formatContent(message.content)
                                    : getTruncatedContent(message.content)}
                            </div>
                        </div>
                    ))}
                </div>

                {messages.length > 3 && (
                    <div className="mt-4 text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-gray-600"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUpIcon className="w-4 h-4 mr-1" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDownIcon className="w-4 h-4 mr-1" />
                                    Show {messages.length - 3} More Message
                                    {messages.length - 3 !== 1 ? "s" : ""}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AgentsCard;
