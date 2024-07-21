import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { azure } from '@ai-sdk/azure';

export enum ModelProvider {
    OpenAI = 'openai',
    Anthropic = 'anthropic',
    Azure = 'azure',
}

export interface ModelConfig {
    name: string;
    provider: ModelProvider;
}

export type ModelKey =
    | 'gpt4o'
    | 'gpt4omini'
    | 'gpt4turbo'
    | 'gpt4'
    | 'gpt35'
    | 'claude35sonnet'
    | 'claude3opus'
    | 'azureGpt4o'
    | 'gptLatest'
    | 'claudeLatest'
    | 'azureLatest';

// Used to specify a model other than the DEFAULT_MODEL_CONFIG for certain usage
export const models: { [key in ModelKey]: ModelConfig } = {
    gpt4o: { name: 'gpt-4o', provider: ModelProvider.OpenAI },
    gpt4omini: { name: 'gpt-4o-mini', provider: ModelProvider.OpenAI },
    gpt4turbo: { name: 'gpt-4-turbo', provider: ModelProvider.OpenAI },
    gpt4: { name: 'gpt-4', provider: ModelProvider.OpenAI },
    gpt35: { name: 'gpt-3.5-turbo', provider: ModelProvider.OpenAI },
    claude35sonnet: {
        name: 'claude-3-5-sonnet-20240620',
        provider: ModelProvider.Anthropic,
    },
    claude3opus: {
        name: 'claude-3-opus-20240229',
        provider: ModelProvider.Anthropic,
    },
    azureGpt4o: { name: 'gpt-4o', provider: ModelProvider.Azure },

    // Latest Models
    gptLatest: { name: 'gpt-4o', provider: ModelProvider.OpenAI },
    claudeLatest: {
        name: 'claude-3-5-sonnet-20240620',
        provider: ModelProvider.Anthropic,
    },
    azureLatest: { name: 'gpt-4o', provider: ModelProvider.Azure },
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
        default:
            throw new Error(
                `Unsupported model provider: ${modelConfig.provider}`
            );
    }
};
