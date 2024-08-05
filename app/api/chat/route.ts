import { convertToCoreMessages, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "@/lib/utils/model-provider";
import { agentsTool, tools } from "./tools";
import buildPrompt from "./prompt-builder";
import { agentsPrompt, keywordCategories } from "./config";

export const maxDuration = 1000;

const shouldUseAdvancedModel = (message: string): boolean =>
    Object.values(keywordCategories).some((category) =>
        category.some((keyword) => message.toLowerCase().includes(keyword))
    );

const getLastNonEmptyMessage = (messages: any[]): string =>
    messages.filter((message) => message.content).pop()?.content || "";

const determineModel = (model: string, lastMessage: string): string => {
    if (model === "auto") {
        return shouldUseAdvancedModel(lastMessage) ? "gpt4o" : "gpt4omini";
    }
    return model === "agents" ? "gpt4omini" : model;
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

    const lastMessage = getLastNonEmptyMessage(messages);
    const modelToUse = determineModel(model, lastMessage);
    const isAgentsModel = model === "agents";

    const system = isAgentsModel
        ? agentsPrompt
        : buildPrompt(
              enableArtifacts,
              enableInstructions,
              enableSafeguards,
              customInstructions
          );

    const toolsToUse: any =
        toolChoice === "none"
            ? (isAgentsModel ? { call_agents: agentsTool } : {})
            : {
                  ...tools,
                  ...(isAgentsModel ? { call_agents: agentsTool } : {})
              };
    const finalToolChoice = isAgentsModel ? "auto" : toolChoice;

    console.log("MODE:", model, ", MODEL:", modelToUse);

    const data = new StreamData();
    const result = await streamText({
        model: getModel(models[modelToUse as ModelKey]),
        system,
        temperature,
        topP,
        maxTokens,
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
