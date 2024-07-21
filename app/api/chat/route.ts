import { convertToCoreMessages, streamText, tool } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { maxTokens, systemPrompt, temperature } from "./config";
import { z } from "zod";

import { createAISDKTools } from '@agentic/stdlib/ai-sdk'
import { WeatherClient, WikipediaClient } from '@agentic/stdlib'

const weather = new WeatherClient()
// const bing = new BingClient()
const wikipedia = new WikipediaClient()

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
        tools: {
            time: tool({
                description: "Get the current time",
                parameters: z.object({
                    timeZone: z
                        .enum(
                            Intl.supportedValuesOf(
                                "timeZone"
                            ) as unknown as readonly [string, ...string[]]
                        )
                        .describe(
                            "The time zone to get the time for. This can be deduced from the location"
                        )
                        .default("America/New_York")
                }),
                execute: async ({ timeZone }) => ({
                    time: new Date().toLocaleTimeString("en-us", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        timeZone
                    })
                }),
            }),
            ...createAISDKTools(weather, wikipedia)
        },
        toolChoice: "auto"
    });

    return result.toAIStreamResponse();
}
