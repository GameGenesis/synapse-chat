import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";

import { createAISDKTools } from "@agentic/stdlib/ai-sdk";
import {
    BingClient,
    JinaClient,
    WeatherClient,
    WikipediaClient
} from "@agentic/stdlib";
import { YoutubeTranscript } from "youtube-transcript";
import formatTime from "@/lib/utils/format";
import { createAgentNetwork } from "@/lib/agents";

const openai = new OpenAI();

const weather = new WeatherClient();
const bing = new BingClient();
const wikipedia = new WikipediaClient();
const jina = new JinaClient();
// const wolframAlpha = new WolframAlphaClient();

const agentNetwork = createAgentNetwork();

export const createAgentsTool = (previousAssistantMessage: string) => (tool({
    description:
        "Call upon agents to perform a specific task. Once you receive their response, double-check and verify it for any issues or missing information. If any arise, add a note amending them. Output a formatted final response to the user.",
    parameters: z.object({
        project: z.string().describe("The original prompt or task description. Be specific and include all key information."),
        context: z.string().optional().describe("The agents do not have any context of this conversation or any messages including this one. Provide the agents with context to complete the task. This can include previous messages in the conversation, previous essay drafts, or the current version of the code. Ensure all necessary context is included in full. Do not add new information, as the project manager agent will plan the instructions to complete the task."),
    }),
    execute: async ({ project, context }) => {
        console.log("### Agents ###");
        const messages = await agentNetwork.executePrompt(project, `Context: ${context}. Previous user content: ${previousAssistantMessage}`);

        return {
            messages,
            explanation: "The agents have completed their tasks. Here are their responses."
        };
    }
}));

export const tools = {
    get_current_time: tool({
        description: "Get the current time",
        parameters: z.object({
            timeZone: z
                .string()
                .describe(
                    "The time zone to get the time for. This can be deduced from the location. Format: IANA Time Zone Database / Olson Time Zone Database / TZ Database (e.g. Asia/Beirut)."
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
    generate_dalle_image: tool({
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
    get_youtube_video_transcript: tool({
        description:
            "Retrieve the complete transcript of a YouTube video using its video ID",
        parameters: z.object({
            videoId: z
                .string()
                .describe(
                    "The unique identifier of the YouTube video. For example, the video ID for 'https://www.youtube.com/watch?v=jNQXAC9IVRw' is 'jNQXAC9IVRw'."
                )
        }),
        execute: async ({ videoId }) => {
            const data = await YoutubeTranscript.fetchTranscript(videoId);
            return {
                transcript: data
                    .map(
                        (line) =>
                            `[${formatTime(Math.floor(line.offset))}] ${
                                line.text
                            }`
                    )
                    .join("\n")
                    .replaceAll("&amp;#39;", "'")
            };
        }
    }),
    // evaluate_math_expression: tool({
    //     description:
    //         "A tool for evaluating mathematical expressions. " +
    //         "Example expressions: " +
    //         "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
    //     parameters: z.object({ expression: z.string() }),
    //     execute: async ({ expression }) => evaluate(expression)
    // }),
    // arxiv_search: tool({
    //     description:
    //         "Search for scientific papers on arXiv. Use this for academic or research purposes",
    //     parameters: z.object({
    //         query: z.string().describe("The search query for arXiv"),
    //         maxResults: z
    //             .number()
    //             .min(1)
    //             .max(10)
    //             .default(5)
    //             .describe("The maximum number of results to return (1-10)")
    //     }),
    //     execute: async ({ query, maxResults }) => {
    //         try {
    //             const results = await searchArxiv(query, maxResults);
    //             return {
    //                 results: results.map((result: ArxivResult) => ({
    //                     title: result.title,
    //                     summary: result.summary,
    //                     authors: result.authors.join(", "),
    //                     published: result.published,
    //                     url: result.id
    //                 }))
    //             };
    //         } catch (error) {
    //             console.error("Error searching arXiv:", error);
    //             return { error: "Failed to search arXiv" };
    //         }
    //     }
    // }),
    ...createAISDKTools(weather, wikipedia, bing, jina)
};
