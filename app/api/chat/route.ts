import { convertToCoreMessages, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { tools } from "./tools";
import buildPrompt from "./prompt-builder";
import { keywordCategories } from "./config";

export const maxDuration = 1000;

const shouldUseAdvancedModel = (message: string): boolean => {
    return Object.values(keywordCategories).some((category) =>
        category.some((keyword) => message.includes(keyword))
    );
};

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
        customInstructions,
        toolChoice
    } = settings;

    const system = buildPrompt(
        enableArtifacts,
        enableInstructions,
        enableSafeguards,
        customInstructions
    );
    const data = new StreamData();

    // Determine the model to use
    let modelToUse = model;
    if (model === "auto") {
        const nonEmptyMessages = messages.filter(
            (message: any) => message.content
        );
        const lastMessage: string =
            nonEmptyMessages[nonEmptyMessages.length - 1].content.toLowerCase();
        modelToUse = shouldUseAdvancedModel(lastMessage)
            ? "gpt4o"
            : "gpt4omini";
    }

    console.log("MODEL SETTING: ", model, ", MODEL USE: ", modelToUse);

    const result = await streamText({
        model: getModel(models[modelToUse as ModelKey]),
        system,
        temperature,
        topP,
        maxTokens,
        messages: convertToCoreMessages(messages),
        tools: toolChoice === "none" ? undefined : tools,
        toolChoice,
        onFinish: async (result) => {
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
