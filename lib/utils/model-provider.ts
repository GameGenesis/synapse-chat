import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { anthropic } from "@ai-sdk/anthropic";
import { azure } from "@ai-sdk/azure";
import { extractReasoningMiddleware, LanguageModelV1Middleware, wrapLanguageModel } from "ai";

// Syntax to create with custom headers:
// const anthropic = createAnthropic({
//     headers: { "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15" }
// });

const groq = createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY
});

export const embeddingModel = openai.embedding("text-embedding-3-small");
export const imageModel = openai.image("dall-e-3");

export const thinkingMiddleware: LanguageModelV1Middleware = {
    transformParams: async ({ type, params }) => {
        return {
            ...params,
            prompt: params.prompt?.map((message, index) => {
                if (index === params.prompt.length - 1 && params.prompt[params.prompt.length - 1].role === "user") {
                    const content = params.prompt[params.prompt.length - 1].content
                    return {
                        ...params.prompt[params.prompt.length - 1],
                        content: Array.isArray(content) ? content.map(part => {
                            if ('text' in part) {
                                console.log(`${part.text}\nMake sure to think step by step and wrap all your reasoning with <thinking> tags`)
                                return {
                                    ...part,
                                    text: `${part.text}\nMake sure to think step by step and wrap all your reasoning with <thinking> tags`
                                };
                            }
                            return part;
                        }) : content,
                    } as any
                }
                return message
            }),
        };
    }
};

const reasoning = wrapLanguageModel({
    model: openai("gpt-4o-mini"),
    middleware: [thinkingMiddleware, extractReasoningMiddleware({ tagName: "thinking" })]
});

export enum ModelProvider {
    OpenAI = "OpenAI",
    Anthropic = "Anthropic",
    Azure = "Azure",
    Groq = "Groq",
    Custom = "Custom",
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
    | "o1"
    | "o1preview"
    | "o1mini"
    | "o3mini"
    | "claude35sonnet"
    | "claude3opus"
    | "claude35haiku"
    | "azureGpt4o"
    | "llama33_70b_specdec"
    | "llama33_70b_versatile"
    | "llama32_90b_vision"
    | "llama32_11b_vision"
    | "llama31_8b"
    | "mixtral_8x7b"
    | "gemma2_9b_it"
    | "deepseek_r1_distill_qwen_32b"
    | "deepseek_r1_distill_llama_70b"
    | "gptLatest"
    | "claudeLatest"
    | "azureLatest"
    | "mathgpt"
    | "reasoning"
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
    o1: {
        model: "o1",
        name: "o1",
        provider: ModelProvider.OpenAI,
        maxTokens: 100000
    },
    o1preview: {
        model: "o1-preview",
        name: "o1-preview",
        provider: ModelProvider.OpenAI,
        maxTokens: 32768
    },
    o1mini: {
        model: "o1-mini",
        name: "o1-mini",
        provider: ModelProvider.OpenAI,
        maxTokens: 65536
    },
    o3mini: {
        model: "o3-mini",
        name: "o3-mini",
        provider: ModelProvider.OpenAI,
        maxTokens: 100000
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
    claude35haiku: {
        model: "claude-3-5-haiku-latest",
        name: "Claude 3.5 Haiku",
        provider: ModelProvider.Anthropic,
        maxTokens: 8192
    },
    azureGpt4o: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.Azure
    },
    llama33_70b_specdec: {
        model: "llama-3.3-70b-specdec",
        name: "Llama 3.3 70B Specdec (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama33_70b_versatile: {
        model: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B Versatile (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 32768
    },
    llama32_90b_vision: {
        model: "llama-3.2-90b-vision-preview",
        name: "Llama 3.2 90B Vision (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama32_11b_vision: {
        model: "llama-3.2-90b-vision-preview",
        name: "Llama 3.2 11B Vision (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8192
    },
    llama31_8b: {
        model: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 8000
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
    deepseek_r1_distill_qwen_32b: {
        model: "deepseek-r1-distill-qwen-32b",
        name: "Deepseek R1 Distill Qwen 32B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 131072
    },
    deepseek_r1_distill_llama_70b: {
        model: "deepseek-r1-distill-llama-70b",
        name: "Deepseek R1 Distill Llama 70B (Groq)",
        provider: ModelProvider.Groq,
        maxTokens: 131072
    },

    // Latest Models
    gptLatest: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.OpenAI,
        maxTokens: 16384
    },
    claudeLatest: {
        model: "claude-3-5-sonnet-latest",
        name: "Claude 3.5 Sonnet",
        provider: ModelProvider.Anthropic,
        maxTokens: 8192
    },
    azureLatest: {
        model: "gpt-4o",
        name: "GPT-4o",
        provider: ModelProvider.Azure,
        maxTokens: 16384
    },

    // Fine-tuned Models
    mathgpt: {
        model: "ft:gpt-4o-mini-2024-07-18:kajoo-ai:math:9zEV9oj4",
        name: "MathGPT",
        provider: ModelProvider.OpenAI,
        maxTokens: 16384
    },

    // Custom Models
    reasoning: {model: "reasoning", name: "Reasoning", provider: ModelProvider.Custom},

    // Other
    auto: { model: "auto", name: "Auto", provider: ModelProvider.Other },
    agents: { model: "agents", name: "Agents", provider: ModelProvider.Other },
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = models.gptLatest;

export const getModel = (modelConfig: ModelConfig) => {
    switch (modelConfig.provider) {
        case ModelProvider.OpenAI:
            return openai(modelConfig.model);
        case ModelProvider.Anthropic:
            return anthropic(modelConfig.model, { cacheControl: true });
        case ModelProvider.Azure:
            return azure(modelConfig.model);
        case ModelProvider.Groq:
            return groq(modelConfig.model);
        case ModelProvider.Custom:
            return reasoning; // TODO: update this for future custom models
        default:
            throw new Error(
                `Unsupported model provider: ${modelConfig.provider}`
            );
    }
};

export const unsupportedToolUseModels: Partial<ModelKey>[] = [
    "llama31_8b",
    "mixtral_8x7b",
    "chatgpt4o",
    "o1mini",
    "o1preview"
];
export const unsupportedArtifactUseModels = ["mixtral_8x7b"];
