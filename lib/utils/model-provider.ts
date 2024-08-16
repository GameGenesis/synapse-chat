import { openai, createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";

const anthropic = createAnthropic({
    headers: { "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15" }
});

const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY
});

export enum ModelProvider {
    OpenAI = "OpenAI",
    Anthropic = "Anthropic",
    Azure = "Azure",
    Groq = "Groq",
    Other = "Other"
}

export interface ModelConfig {
    model: string;
    name: string;
    provider: ModelProvider;
    maxTokens?: number;
}

export type ModelKey =
    | "chatgpt4o"
    | "gpt4o"
    | "gpt4omini"
    | "gpt4turbo"
    | "gpt4"
    | "gpt35"
    | "claude35sonnet"
    | "claude3opus"
    | "azureGpt4o"
    | "llama31_405b"
    | "llama31_70b"
    | "llama31_8b"
    | "llama_3_70b_tool_use"
    | "mixtral_8x7b"
    | "gemma2_9b_it"
    | "gptLatest"
    | "claudeLatest"
    | "azureLatest"
    | "auto"
    | "agents";

// Used to specify a model other than the DEFAULT_MODEL_CONFIG for certain usage
export const models: { [key in ModelKey]: ModelConfig } = {
    chatgpt4o: {
        model: "chatgpt-4o-latest",
        name: "ChatGPT 4o",
        provider: ModelProvider.OpenAI,
        maxTokens: 16384
    },
    gpt4o: {
        model: "gpt-4o-2024-08-06",
        name: "GPT-4o",
        provider: ModelProvider.OpenAI,
        maxTokens: 16384
    }, // Change back to gpt-4o (latest)
    gpt4omini: {
        model: "gpt-4o-mini",
        name: "GPT-4o mini",
        provider: ModelProvider.OpenAI,
        maxTokens: 16384
    },
    gpt4turbo: {
        model: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: ModelProvider.OpenAI,
        maxTokens: 4096
    },
    gpt4: {
        model: "gpt-4",
        name: "GPT-4",
        provider: ModelProvider.OpenAI,
        maxTokens: 8192
    },
    gpt35: {
        model: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: ModelProvider.OpenAI,
        maxTokens: 4096
    },
    claude35sonnet: {
        model: "claude-3-5-sonnet-20240620",
        name: "Claude 3.5 Sonnet",
        provider: ModelProvider.Anthropic,
        maxTokens: 8192
    },
    claude3opus: {
        model: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        provider: ModelProvider.Anthropic
    },
    azureGpt4o: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.Azure
    },
    llama31_405b: {
        model: "llama-3.1-405b-reasoning",
        name: "Llama 3.1 405B (Groq)",
        provider: ModelProvider.Groq
    }, // not available for free yet
    llama31_70b: {
        model: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B (Groq)",
        provider: ModelProvider.Groq
    },
    llama31_8b: {
        model: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B (Groq)",
        provider: ModelProvider.Groq
    },
    llama_3_70b_tool_use: {
        model: "llama3-groq-70b-8192-tool-use-preview",
        name: "Llama 3.1 70B Tools (Groq)",
        provider: ModelProvider.Groq
    },
    mixtral_8x7b: {
        model: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B (Groq)",
        provider: ModelProvider.Groq
    },
    gemma2_9b_it: {
        model: "gemma2-9b-it",
        name: "Gemma2 9B (Groq)",
        provider: ModelProvider.Groq
    },

    // Latest Models
    gptLatest: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.OpenAI
    },
    claudeLatest: {
        model: "claude-3-5-sonnet-20240620",
        name: "Claude 3.5 Sonnet",
        provider: ModelProvider.Anthropic
    },
    azureLatest: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.Azure
    },

    // Other
    auto: { model: "auto", name: "Auto", provider: ModelProvider.Other },
    agents: { model: "agents", name: "Agents", provider: ModelProvider.Other }
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = models.gptLatest;

export const getModel = (modelConfig: ModelConfig) => {
    switch (modelConfig.provider) {
        case ModelProvider.OpenAI:
            return openai(modelConfig.model);
        case ModelProvider.Anthropic:
            return anthropic(modelConfig.model);
        case ModelProvider.Azure:
            return azure(modelConfig.model);
        case ModelProvider.Groq:
            return groq(modelConfig.model);
        default:
            throw new Error(
                `Unsupported model provider: ${modelConfig.provider}`
            );
    }
};

export const unsupportedToolUseModels = [
    "llama31_8b",
    "llama31_70b",
    "mixtral_8x7b",
    "chatgpt4o"
];
export const unsupportedArtifactUseModels = ["mixtral_8x7b"];
