import { ModelKey } from "@/app/api/chat/model-provider";
import { ToolInvocation } from "ai";

export interface Artifact {
    identifier: string;
    type: string;
    language: string;
    title: string;
    content: string;
}

export interface CodeProps {
    node?: any;
    inline?: any;
    className?: any;
    children?: any;
}

export type CombinedMessage = {
    id: string;
    role: "user" | "assistant" | "system" | "function" | "tool" | "data";
    originalContent: string;
    processedContent: string;
    attachments: any;
    artifact?: Artifact;
    model?: ModelKey;
    toolInvocations?: ToolInvocation[];
    completionTokens?: number;
    promptTokens?: number;
    totalTokens?: number;
    finishReason?:
        | "stop"
        | "length"
        | "content-filter"
        | "tool-calls"
        | "error"
        | "other"
        | "unknown";
    states: {
        content: string;
        artifact?: Artifact;
        timestamp: number;
    }[];
};
