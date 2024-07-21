import { convertToCoreMessages, streamText, tool } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { maxTokens, systemPrompt, temperature } from "./config";
import { tools } from "./tools";

export const maxDuration = 1000;

export async function POST(req: Request) {
    const { messages, model }: { messages: any; model: ModelKey } =
        await req.json();

    console.log(model);

    const result = await streamText({
        model: getModel(models[model]),
        system: systemPrompt,
        maxTokens: maxTokens,
        temperature: temperature,
        messages: convertToCoreMessages(messages),
        tools,
        toolChoice: "auto"
    });

    return result.toAIStreamResponse();
}
