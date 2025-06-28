import {
    convertToCoreMessages,
    CoreMessage,
    createDataStreamResponse,
    smoothStream,
    streamText
} from "ai";
import {
    getModel,
    ModelKey,
    models,
    unsupportedArtifactUseModels,
    unsupportedToolUseModels
} from "@/lib/utils/model-provider";
import { createAgentsTool, tools } from "./tools";
import buildPrompt from "./prompt-builder";
import {
    agentsPrompt,
    DEFAULT_AGENT_SETTINGS,
    keywordCategories,
    maxSteps,
    toolsPrompt
} from "./config";
import { ToolChoice } from "@/lib/types";
import { limitMessages } from "@/lib/utils/message-manager";
import { findRelevantMemories, extractMemory } from "@/lib/memory";

export const maxDuration = 100; // Timeout in seconds

const shouldUseAdvancedModel = (message: string): boolean =>
    Object.values(keywordCategories).some((category) =>
        category.some((keyword) => message.toLowerCase().includes(keyword))
    );

const determineModel = (model: ModelKey, messages: any[]): ModelKey => {
    const lastMessage =
        messages.reverse().find((message) => message.content)?.content ?? "";

    if (model === "agents") {
        return "gpt4omini";
    }

    if (model === "auto") {
        return shouldUseAdvancedModel(lastMessage) ? "gpt4o" : "gpt4omini";
    }

    return model;
};

const getToolsToUse = (
    toolChoice: ToolChoice,
    model: ModelKey,
    messages: any[]
): { toolChoice: ToolChoice; tools: any } => {
    const previousAssistantMessage =
        messages.reverse().find((message: any) => message.role === "assistant")
            ?.content ?? "";
    const agentsTool = createAgentsTool(previousAssistantMessage);

    if (toolChoice === "none" || unsupportedToolUseModels.includes(model)) {
        return {
            toolChoice: "none",
            tools: model === "agents" ? { call_agents: agentsTool } : {}
        };
    }
    return {
        toolChoice:
            model === "agents"
                ? DEFAULT_AGENT_SETTINGS.toolChoice!
                : toolChoice,
        tools: {
            ...tools,
            ...(model === "agents" ? { call_agents: agentsTool } : {})
        }
    };
};

export async function POST(req: Request) {
    const { userId, messages, settings } = await req.json();

    const {
        model,
        temperature,
        topP,
        maxTokens,
        messageLimit,
        enableArtifacts,
        enableInstructions,
        enableSafeguards,
        enableLogicMode,
        enableMemory,
        customInstructions,
        toolChoice
    } = settings;

    const modelToUse = determineModel(model, messages?.slice());
    const useAgents = model === "agents";

    const { toolChoice: finalToolChoice, tools: toolsToUse } = getToolsToUse(
        toolChoice,
        model,
        messages?.slice()
    );
    const {
        temperature: finalTemperature,
        topP: finalTopP,
        maxTokens: finalMaxTokens
    } = useAgents ? DEFAULT_AGENT_SETTINGS : { temperature, topP, maxTokens };

    const limitedMessages = (await limitMessages(
        [...messages],
        messageLimit
    )) as any;

    const userMessages = messages.filter(
        (message: CoreMessage) => message.role === "user"
    );
    const lastUserMessage = userMessages[userMessages.length - 1].content;
    const relevantMemories = enableMemory
        ? await findRelevantMemories(lastUserMessage, userId)
        : []; // This can be a tool as well

    const system = useAgents
        ? `${agentsPrompt}${toolsPrompt}${relevantMemories.join("\n")}`
        : buildPrompt(
              enableArtifacts && !unsupportedArtifactUseModels.includes(model),
              enableInstructions,
              enableSafeguards,
              enableLogicMode,
              finalToolChoice !== "none",
              relevantMemories,
              customInstructions
          );

    if (enableMemory) {
        extractMemory(lastUserMessage, userId);
    }

    const thinkingModels = ["o1", "o1pro", "o3", "o3mini", "o3pro", "o4mini"]
    const role = thinkingModels.includes(modelToUse)
        ? "user"
        : "system";
    const maxTokensKey = thinkingModels.includes(
        modelToUse
    )
        ? "maxCompletionTokens"
        : "maxTokens";

    return createDataStreamResponse({
        execute: async (dataStream) => {
            let accumulatedReasoning = "";

            const result = streamText({
                model: getModel(models[modelToUse]),
                temperature: thinkingModels.includes(modelToUse) ? 1 : finalTemperature,
                topP: finalTopP,
                [maxTokensKey]: finalMaxTokens,
                messages: [
                    {
                        role,
                        content: system,
                        experimental_providerMetadata: {
                            anthropic: { cacheControl: { type: "ephemeral" } }
                        }
                    },
                    ...convertToCoreMessages(limitedMessages)
                ],
                tools: toolsToUse,
                toolChoice: finalToolChoice,
                maxSteps,
                experimental_continueSteps: true,
                experimental_transform: smoothStream(),
                // Use this for o1 and o3-mini
                // providerOptions: {
                //     openai: { reasoningEffort: "low" }
                // },
                onChunk: async ({ chunk }) => {
                    if (chunk.type === "reasoning") {
                        accumulatedReasoning += chunk.textDelta;
                        dataStream.writeData({
                            reasoning: accumulatedReasoning
                        });
                    }
                },
                onFinish: async (result) => {
                    if (result.text) {
                        const metadata = result.experimental_providerMetadata;

                        const anthropicTokens = {
                            cacheCreationInputTokens:
                                metadata?.anthropic?.cacheCreationInputTokens ?? 0,
                            cacheReadInputTokens:
                                metadata?.anthropic?.cacheReadInputTokens ?? 0
                        };

                        const openaiTokens = {
                            cachedPromptTokens:
                                metadata?.openai?.cachedPromptTokens ?? 0
                        };

                        const cacheReadTokens =
                            (anthropicTokens.cacheReadInputTokens as number) +
                            (openaiTokens.cachedPromptTokens as number);
                        const cacheWriteTokens =
                            anthropicTokens.cacheCreationInputTokens;

                        dataStream.writeData({
                            completionTokens: result.usage.completionTokens,
                            promptTokens: result.usage.promptTokens,
                            totalTokens: result.usage.totalTokens,
                            cacheWriteTokens,
                            cacheReadTokens,
                            finishReason: result.finishReason,
                            reasoning: result.reasoning ?? ""
                        });
                    }
                }
            });

            result.mergeIntoDataStream(dataStream);
        },
        onError: (error) => {
            console.error(error);
            return error instanceof Error ? error.message : String(error);
        }
    });
}
