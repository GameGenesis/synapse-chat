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

export interface Data {
    completionTokens?: number;
    promptTokens?: number;
    totalTokens?: number;
    finishReason?: FinishReason;
}

export type Role =
    | "user"
    | "assistant"
    | "system"
    | "function"
    | "tool"
    | "data";

export type FinishReason =
    | "stop"
    | "length"
    | "content-filter"
    | "tool-calls"
    | "error"
    | "other"
    | "unknown";

export type CombinedMessage = {
    id: string;
    role: Role;
    originalContent: string;
    processedContent: string;
    attachments: any;
    artifact?: Artifact;
    model?: ModelKey;
    toolInvocations?: ToolInvocation[];
    completionTokens?: number;
    promptTokens?: number;
    totalTokens?: number;
    finishReason?: FinishReason;
    states: {
        content: string;
        artifact?: Artifact;
        timestamp: number;
    }[];
};
