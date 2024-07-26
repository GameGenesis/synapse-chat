import { convertToCoreMessages, StreamData, streamText } from "ai";
import { getModel, ModelKey, models } from "./model-provider";
import { tools } from "./tools";
import buildPrompt from "./prompt-builder";
import dbConnect from "@/utils/db";
import Chat from "@/models/chat";

export const maxDuration = 1000;

export async function POST(req: Request) {
    await dbConnect();

    const { messages, chatId, settings, combinedMessages } = await req.json();

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

    let newChatId = chatId;

    // Function to update or create chat in the background
    const updateChat = async (id: string | null, messages: any, settings: any) => {
        try {
            if (id) {
                await Chat.findByIdAndUpdate(id, {
                    messages: messages,
                    settings: settings
                });
            } else {
                const chat = new Chat({
                    messages: messages,
                    settings: settings
                });
                await chat.save();
                newChatId = chat._id;
            }
        } catch (error) {
            console.error("Error updating chat:", error);
        }
    };

    // Perform initial chat update or creation
    updateChat(chatId, combinedMessages, settings);

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
                    chatId: newChatId
                });
            }
            data.close();

            // Update chat with the latest messages in the background
            await updateChat(newChatId, combinedMessages, settings);
        }
    });

    return result.toAIStreamResponse({ data });
}
