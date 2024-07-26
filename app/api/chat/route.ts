import { convertToCoreMessages, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { tools } from "./tools";
import buildPrompt from "./prompt-builder";

export const maxDuration = 1000;

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
        enableTools,
        customInstructions
    } = settings;

    const system = buildPrompt(
        enableArtifacts,
        enableInstructions,
        enableSafeguards,
        customInstructions
    );
    const data = new StreamData();

    const result = await streamText({
        model: getModel(models[model as ModelKey]),
        system,
        temperature,
        topP,
        maxTokens,
        messages: convertToCoreMessages(messages),
        tools: enableTools ? tools : undefined,
        toolChoice: "auto",
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
        }
    });

    return result.toAIStreamResponse({ data });
}
