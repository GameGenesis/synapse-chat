import { convertToCoreMessages, CoreTool, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "@/lib/utils/model-provider";
import { createAgentsTool, tools } from "./tools";
import buildPrompt from "./prompt-builder";
import {
    agentsPrompt,
    DEFAULT_AGENT_SETTINGS,
    keywordCategories
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
    previousAssistantMessage: string
): Record<string, CoreTool> => {
    const agentsTool = createAgentsTool(previousAssistantMessage);

    if (toolChoice === "none") {
        return isAgentsModel ? { call_agents: agentsTool } : {};
    }
    return {
        ...tools,
        ...(isAgentsModel ? { call_agents: agentsTool } : {})
    };
};

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

    const modelToUse = determineModel(model, JSON.parse(JSON.stringify(messages)));
    const useAgents = model === "agents";

    const system = useAgents
        ? agentsPrompt
        : buildPrompt(
              enableArtifacts,
              enableInstructions,
              enableSafeguards,
              customInstructions
          );

    const previousAssistantMessage = messages.reverse().find((message: any) => message.role === "assistant")?.content ?? ""
    const toolsToUse = getToolsToUse(toolChoice, useAgents, previousAssistantMessage);
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
