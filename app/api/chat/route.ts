import { convertToCoreMessages, CoreTool, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "@/lib/utils/model-provider";
import { createAgentsTool, tools } from "./tools";
import buildPrompt from "./prompt-builder";
import {
    agentsPrompt,
    DEFAULT_AGENT_SETTINGS,
    keywordCategories,
    toolsPrompt
} from "./config";
import { ToolChoice } from "@/lib/types";

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
    isAgentsModel: boolean,
    messages: any[]
): Record<string, CoreTool> => {
    const previousAssistantMessage = messages.reverse().find((message: any) => message.role === "assistant")?.content ?? "";
    const agentsTool = createAgentsTool(previousAssistantMessage);

    if (toolChoice === "none") {
        return isAgentsModel ? { call_agents: agentsTool } : {};
    }
    return {
        ...tools,
        ...(isAgentsModel ? { call_agents: agentsTool } : {})
    };
};

const cloneObject = (obj: object) => {
    return JSON.parse(JSON.stringify(obj));
}

export async function POST(req: Request) {
    const { messages, settings } = await req.json();

    const {
        model,
        temperature,
        topP,
        maxTokens,
        enableArtifacts,
        enableInstructions,
        enableSafeguards,
        customInstructions,
        toolChoice
    } = settings;

    const modelToUse = determineModel(model, cloneObject(messages));
    const useAgents = model === "agents";

    const system = useAgents
        ? `${agentsPrompt}${toolsPrompt}`
        : buildPrompt(
              enableArtifacts,
              enableInstructions,
              enableSafeguards,
              toolChoice !== "none",
              customInstructions
          );

    const toolsToUse = getToolsToUse(toolChoice, useAgents, cloneObject(messages));
    const finalToolChoice = useAgents
        ? DEFAULT_AGENT_SETTINGS.toolChoice
        : toolChoice;
    const {
        temperature: finalTemperature,
        topP: finalTopP,
        maxTokens: finalMaxTokens
    } = useAgents ? DEFAULT_AGENT_SETTINGS : { temperature, topP, maxTokens };

    console.log("MODE:", model, ", MODEL:", modelToUse);

    const data = new StreamData();
    const result = await streamText({
        model: getModel(models[modelToUse]),
        system,
        temperature: finalTemperature,
        topP: finalTopP,
        maxTokens: finalMaxTokens,
        messages: convertToCoreMessages(messages),
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
