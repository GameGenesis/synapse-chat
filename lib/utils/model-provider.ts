import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";

// Syntax to create with custom headers:
// const anthropic = createAnthropic({
//     headers: { "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15" }
// });

const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY
});

export const embeddingModel = openai.embedding("text-embedding-3-small")

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
    | "claude3haiku"
    | "azureGpt4o"
    | "llama32_90b"
    | "llama32_90b_vision"
    | "llama32_11b"
    | "llama32_11b_vision"
    | "llama31_405b"
    | "llama31_70b"
    | "llama31_8b"
    | "llama_3_70b_tool_use"
    | "mixtral_8x7b"
    | "gemma2_9b_it"
    | "gptLatest"
    | "claudeLatest"
    | "azureLatest"
    | "mathgpt"
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
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.OpenAI,
        maxTokens: 16384
    },
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
        model: "claude-3-5-sonnet-latest",
        name: "Claude 3.5 Sonnet",
        provider: ModelProvider.Anthropic,
        maxTokens: 8192
    },
    claude3opus: {
        model: "claude-3-opus-latest",
        name: "Claude 3 Opus",
        provider: ModelProvider.Anthropic
    },
    claude3haiku: {
        model: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        provider: ModelProvider.Anthropic
    },
    azureGpt4o: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.Azure
    },
    llama32_90b: {
        model: "llama-3.2-90b-text-preview",
        name: "Llama 3.2 90B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama32_90b_vision: {
        model: "llama-3.2-90b-vision-preview",
        name: "Llama 3.2 90B Vision (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama32_11b: {
        model: "llama-3.2-11b-text-preview",
        name: "Llama 3.2 11B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama32_11b_vision: {
        model: "llama-3.2-90b-vision-preview",
        name: "Llama 3.2 11B Vision (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama31_405b: {
        model: "llama-3.1-405b-reasoning",
        name: "Llama 3.1 405B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 32768
    }, // not available for free yet
    llama31_70b: {
        model: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 32768
    },
    llama31_8b: {
        model: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 131072
    },
    llama_3_70b_tool_use: {
        model: "llama3-groq-70b-8192-tool-use-preview",
        name: "Llama 3.1 70B Tools (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    mixtral_8x7b: {
        model: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 32768
    },
    gemma2_9b_it: {
        model: "gemma2-9b-it",
        name: "Gemma2 9B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },

    // Latest Models
    gptLatest: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.OpenAI
    },
    claudeLatest: {
        model: "claude-3-5-sonnet-latest",
        name: "Claude 3.5 Sonnet",
        provider: ModelProvider.Anthropic
    },
    azureLatest: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.Azure
    },

    // Custom models
    mathgpt: {
        model: "ft:gpt-4o-mini-2024-07-18:kajoo-ai:math:9zEV9oj4",
        name: "MathGPT",
        provider: ModelProvider.OpenAI
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
