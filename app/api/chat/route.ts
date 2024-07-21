import { convertToCoreMessages, StreamData, streamText, tool } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { maxTokens, systemPrompt, temperature } from "./config";
import { tools } from "./tools";

export const maxDuration = 1000;

export async function POST(req: Request) {
    const { messages, model }: { messages: any; model: ModelKey } =
        await req.json();

    const data = new StreamData();
    data.append({})

    const result = await streamText({
        model: getModel(models[model]),
        system: systemPrompt,
        maxTokens: maxTokens,
        temperature: temperature,
        messages: convertToCoreMessages(messages),
        tools,
        toolChoice: "auto",
        onFinish: (result) => {
            if (result.text) {
                data.append({
                    completionTokens: result.usage.completionTokens,
                    promptTokens: result.usage.promptTokens,
                    totalTokens: result.usage.totalTokens,
                });
            }
            data.close();
        }
    });

    return result.toAIStreamResponse({ data });
}
