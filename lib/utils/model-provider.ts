import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export enum ModelProvider {
    OpenAI = "openai",
    Anthropic = "anthropic",
    Azure = "azure",
    Groq = "groq"
}

export interface ModelConfig {
    name: string;
    provider: ModelProvider;
}

export type ModelKey =
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
    gpt4o: { name: "gpt-4o", provider: ModelProvider.OpenAI },
    gpt4omini: { name: "gpt-4o-mini", provider: ModelProvider.OpenAI },
    gpt4turbo: { name: "gpt-4-turbo", provider: ModelProvider.OpenAI },
    gpt4: { name: "gpt-4", provider: ModelProvider.OpenAI },
    gpt35: { name: "gpt-3.5-turbo", provider: ModelProvider.OpenAI },
    claude35sonnet: {
        name: "claude-3-5-sonnet-20240620",
        provider: ModelProvider.Anthropic
    },
    claude3opus: {
        name: "claude-3-opus-20240229",
        provider: ModelProvider.Anthropic
    },
    azureGpt4o: { name: "gpt-4o", provider: ModelProvider.Azure },
    llama31_405b: { name: "llama-3.1-405b-reasoning", provider: ModelProvider.Groq }, // not available for free yet
    llama31_70b: { name: "llama-3.1-70b-versatile", provider: ModelProvider.Groq },
    llama31_8b: { name: "llama-3.1-8b-instant", provider: ModelProvider.Groq },
    llama_3_70b_tool_use: { name: "llama3-groq-70b-8192-tool-use-preview", provider: ModelProvider.Groq },
    mixtral_8x7b: { name: "mixtral-8x7b-32768", provider: ModelProvider.Groq },
    gemma2_9b_it: { name: "gemma2-9b-it", provider: ModelProvider.Groq },

    // Latest Models
    gptLatest: { name: "gpt-4o", provider: ModelProvider.OpenAI },
    claudeLatest: {
        name: "claude-3-5-sonnet-20240620",
        provider: ModelProvider.Anthropic
    },
    azureLatest: { name: "gpt-4o", provider: ModelProvider.Azure },

    // Auto
    auto: { name: "auto", provider: ModelProvider.OpenAI },
    agents: { name: "agents", provider: ModelProvider.OpenAI }
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = models.gptLatest;

export const getModel = (modelConfig: ModelConfig) => {
    switch (modelConfig.provider) {
        case ModelProvider.OpenAI:
            return openai(modelConfig.name);
        case ModelProvider.Anthropic:
            return anthropic(modelConfig.name);
        case ModelProvider.Azure:
            return azure(modelConfig.name);
        case ModelProvider.Groq:
                return groq(modelConfig.name);
        default:
            throw new Error(
                `Unsupported model provider: ${modelConfig.provider}`
            );
    }
};
