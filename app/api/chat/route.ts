import { convertToCoreMessages, streamText, tool } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { maxTokens, systemPrompt, temperature } from "./config";
import { z } from "zod";

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
            weather: tool({
                description: "Get the weather in a location",
                parameters: z.object({
                    location: z
                        .string()
                        .describe("The location to get the weather for")
                }),
                execute: async ({ location }) => ({
                    location,
                    temperature: 72 + Math.floor(Math.random() * 21) - 10
                })
            }),
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
                })
            })
        },
        toolChoice: "auto"
    });

    return result.toAIStreamResponse();
}
