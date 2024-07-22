import { convertToCoreMessages, StreamData, streamText, tool } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { tools } from "./tools";
import buildPrompt from "./prompt-builder";

export const runtime = "edge";
export const maxDuration = 1000;

export async function POST(req: Request) {
    const {
        messages,
        model,
        temperature,
        maxTokens,
        enableArtifacts,
        enableInstructions,
        enableSafeguards,
        enableTools,
        userPrompt
    }: {
        messages: any;
        model: ModelKey;
        temperature: number;
        maxTokens: number;
        enableArtifacts: boolean;
        enableInstructions: boolean;
        enableSafeguards: boolean;
        enableTools: boolean;
        userPrompt?: string;
    } = await req.json();

    const system = buildPrompt(
        enableArtifacts,
        enableInstructions,
        enableSafeguards,
        userPrompt
    );
    const data = new StreamData();
    data.append({});

    const result = await streamText({
        model: getModel(models[model]),
        system,
        temperature,
        maxTokens,
        messages: convertToCoreMessages(messages),
        tools: enableTools ? tools : undefined,
        toolChoice: "auto",
        onFinish: (result) => {
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
