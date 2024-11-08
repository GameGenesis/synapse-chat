import { ModelKey } from "@/lib/utils/model-provider";
import { ToolInvocation } from "ai";

export interface Artifact {
    identifier: string;
    type: string;
    language: string;
    title: string;
    content: string;
    shareableURL?: string;
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
    cacheWriteTokens?: number;
    cacheReadTokens?: number;
    finishReason?: FinishReason;
    chatId?: string;
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
    cacheWriteTokens?: number;
    cacheReadTokens?: number;
    finishReason?: FinishReason;
    states: {
        content: string;
        artifact?: Artifact;
        timestamp: number;
    }[];
};

export type Settings = {
    model: ModelKey;
    temperature: number;
    maxTokens: number;
    topP: number;
    messageLimit: number;
    enableArtifacts: boolean;
    enableInstructions: boolean;
    enableSafeguards: boolean;
    enableLogicMode: boolean;
    enableMemory: boolean;
    enablePasteToFile: boolean;
    customInstructions: string;
    toolChoice: ToolChoice;
};

export type Action =
    | { type: "SET_CHAT_ID"; payload: string | null }
    | { type: "SET_MODEL"; payload: ModelKey }
    | { type: "SET_TEMPERATURE"; payload: number }
    | { type: "SET_MAX_TOKENS"; payload: number }
    | { type: "SET_TOP_P"; payload: number }
    | { type: "SET_MESSAGE_LIMIT"; payload: number }
    | { type: "SET_ENABLE_ARTIFACTS"; payload: boolean }
    | { type: "SET_ENABLE_INSTRUCTIONS"; payload: boolean }
    | { type: "SET_ENABLE_SAFEGUARDS"; payload: boolean }
    | { type: "SET_ENABLE_LOGIC_MODE"; payload: boolean }
    | { type: "SET_ENABLE_TOOLS"; payload: boolean }
    | { type: "SET_ENABLE_PASTE_TO_FILE"; payload: boolean }
    | { type: "SET_ENABLE_MEMORY"; payload: boolean }
    | { type: "SET_CUSTOM_INSTRUCTIONS"; payload: string }
    | { type: "SET_TOOL_CHOICE"; payload: ToolChoice };

export interface WikipediaSearchResult {
    id: number;
    key: string;
    title: string;
    excerpt: string;
    description?: string;
    thumbnail?: {
        url: string;
    };
}

export type ToolChoice =
    | "auto"
    | "required"
    | "none"
    | { type: "tool"; toolName: string };
