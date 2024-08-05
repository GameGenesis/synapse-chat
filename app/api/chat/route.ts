import { convertToCoreMessages, CoreTool, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "@/lib/utils/model-provider";
import { agentsTool, tools } from "./tools";
import buildPrompt from "./prompt-builder";
import { agentsPrompt, DEFAULT_AGENT_SETTINGS, keywordCategories } from "./config";
import { Settings, ToolChoice } from "@/lib/types";

export const maxDuration = 1000;

const shouldUseAdvancedModel = (message: string): boolean =>
  Object.values(keywordCategories).some((category) =>
    category.some((keyword) => message.toLowerCase().includes(keyword))
  );

const getLastNonEmptyMessage = (messages: any[]): string =>
  messages.reverse().find((message) => message.content)?.content ?? "";

const determineModel = (model: string, lastMessage: string): ModelKey => {
  if (model === "auto") {
    return shouldUseAdvancedModel(lastMessage) ? "gpt4o" : "gpt4omini";
  }
  return (model === "agents" ? "gpt4omini" : model) as ModelKey;
};

const getToolsToUse = (toolChoice: ToolChoice, isAgentsModel: boolean): Record<string, CoreTool> => {
  if (toolChoice === "none") {
    return isAgentsModel ? { call_agents: agentsTool } : {};
  }
  return {
    ...tools,
    ...(isAgentsModel ? { call_agents: agentsTool } : {}),
  };
};

export async function POST(req: Request) {
  const { messages, settings }: { messages: any[]; settings: Settings } = await req.json();
  const {
    model,
    temperature,
    topP,
    maxTokens,
    enableArtifacts,
    enableInstructions,
    enableSafeguards,
    customInstructions,
    toolChoice,
  } = settings;

  const lastMessage = getLastNonEmptyMessage(messages);
  const modelToUse = determineModel(model, lastMessage);
  const isAgentsModel = model === "agents";

  const system = isAgentsModel
    ? agentsPrompt
    : buildPrompt(enableArtifacts, enableInstructions, enableSafeguards, customInstructions);

  const toolsToUse = getToolsToUse(toolChoice, isAgentsModel);
  const finalToolChoice = isAgentsModel ? DEFAULT_AGENT_SETTINGS.toolChoice : toolChoice;
  const { temperature: finalTemperature, topP: finalTopP, maxTokens: finalMaxTokens } = isAgentsModel
    ? DEFAULT_AGENT_SETTINGS
    : { temperature, topP, maxTokens };

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
          finishReason: result.finishReason,
        });
      }
      data.close();
    },
  });

  return result.toAIStreamResponse({ data });
}
