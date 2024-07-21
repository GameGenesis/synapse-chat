import { convertToCoreMessages, streamText, tool } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { maxTokens, systemPrompt, temperature } from "./config";
import { z } from "zod";

import OpenAI from 'openai';

import { createAISDKTools } from '@agentic/stdlib/ai-sdk'
import { BingClient, WeatherClient, WikipediaClient } from '@agentic/stdlib'

const openai = new OpenAI();

const weather = new WeatherClient()
const bing = new BingClient()
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
            image: tool({
                description: "Generate an image (using DALLE)",
                parameters: z.object({
                    prompt: z.string().describe("The prompt used to generate the image"),
                    size: z.enum(["1024x1024", "256x256", "512x512", "1792x1024", "1024x1792"]).describe("The size of the image").default("1024x1024")
                }),
                execute: async({prompt, size}) => ({
                    url: (await openai.images.generate({
                        model: "dall-e-3",
                        prompt,
                        n: 1,
                        size,
                      })).data[0].url
                })
            }),
            ...createAISDKTools(weather, wikipedia, bing)
        },
        toolChoice: "auto"
    });

    return result.toAIStreamResponse();
}
