import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";

import { createAISDKTools } from "@agentic/stdlib/ai-sdk";
import { BingClient, WeatherClient, WikipediaClient } from "@agentic/stdlib";
import { evaluate } from "mathjs";

const openai = new OpenAI();

const weather = new WeatherClient();
const bing = new BingClient();
const wikipedia = new WikipediaClient();

export const tools = {
    get_current_time: tool({
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
    }),
    dalle_image_generation: tool({
        description: "Generate an image (using DALLE)",
        parameters: z.object({
            prompt: z
                .string()
                .describe("The prompt used to generate the image"),
            size: z
                .enum([
                    "1024x1024",
                    "256x256",
                    "512x512",
                    "1792x1024",
                    "1024x1792"
                ])
                .describe("The size of the image")
                .default("1024x1024")
        }),
        execute: async ({ prompt, size }) => ({
            url: (
                await openai.images.generate({
                    model: "dall-e-3",
                    prompt,
                    n: 1,
                    size
                })
            ).data[0].url
        })
    }),
    calculate_math_expression: tool({
        description:
            "A tool for evaluating mathematical expressions. " +
            "Example expressions: " +
            "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
        parameters: z.object({ expression: z.string() }),
        execute: async ({ expression }) => evaluate(expression)
    }),
    ...createAISDKTools(weather, wikipedia, bing)
}