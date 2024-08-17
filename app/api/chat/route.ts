import { convertToCoreMessages, StreamData, streamText } from "ai";
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
    toolsPrompt
} from "./config";
import { ToolChoice } from "@/lib/types";
import { limitMessages } from "@/lib/utils/message-manager";
import { findRelevantMemories } from "@/lib/utils/embeddings";
import { extractMemory } from "@/lib/utils/memory-manager";

export const maxDuration = 1000;

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

const cloneObject = (obj: object) => {
    return JSON.parse(JSON.stringify(obj));
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
        enableMemory,
        customInstructions,
        toolChoice
    } = settings;

    const modelToUse = determineModel(model, cloneObject(messages));
    const useAgents = model === "agents";

    const { toolChoice: finalToolChoice, tools: toolsToUse } = getToolsToUse(
        toolChoice,
        model,
        cloneObject(messages)
    );
    const {
        temperature: finalTemperature,
        topP: finalTopP,
        maxTokens: finalMaxTokens
    } = useAgents ? DEFAULT_AGENT_SETTINGS : { temperature, topP, maxTokens };

    console.log("MODE:", model, ", MODEL:", modelToUse);

    const limitedMessages = (await limitMessages(
        [...messages],
        messageLimit
    )) as any;

    const lastMessage = messages[messages.length - 1].content;
    const relevantMemories = enableMemory
        ? await findRelevantMemories(lastMessage, userId)
        : []; // This can be a tool as well

    // Add relevant memories to the system prompt
    const memoriesPrompt =
        relevantMemories.length > 0
            ? `\n\nRelevant memories:\n${relevantMemories.join("\n")}`
            : "";

    console.log(memoriesPrompt);

    const system = useAgents
        ? `${agentsPrompt}${toolsPrompt}${memoriesPrompt}`
        : buildPrompt(
              enableArtifacts && !unsupportedArtifactUseModels.includes(model),
              enableInstructions,
              enableSafeguards,
              finalToolChoice !== "none",
              memoriesPrompt,
              customInstructions
          );

    if (enableMemory) {
        extractMemory(lastMessage, userId);
    }

    const data = new StreamData();
    const result = await streamText({
        model: getModel(models[modelToUse]),
        system,
        temperature: finalTemperature,
        topP: finalTopP,
        maxTokens: finalMaxTokens,
        messages: convertToCoreMessages(limitedMessages),
        tools: toolsToUse,
        toolChoice: finalToolChoice,
        onFinish: async (result) => {
            if (result.text) {
                data.append({
                    completionTokens: result.usage.completionTokens,
                    promptTokens: result.usage.promptTokens,
                    totalTokens: result.usage.totalTokens,
                    finishReason: result.finishReason
                });
            }
            data.close();
        }
    });

    return result.toAIStreamResponse({ data });
}
