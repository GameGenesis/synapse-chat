import { CoreMessage, generateText } from "ai";
import { getModel, models } from "./model-provider";

const summarizeMessages = async (messages: CoreMessage[]) => {
    const { text } = await generateText({
        model: getModel(models.gpt4omini),
        system: `
You will be given a series of messages within <messages> tags from a conversation between a user and an AI assistant. Your task is to provide a concise summary of these messages.

Please summarize the conversation above in no more than 50 words. Make sure to include key information and main points discussed. Your summary must be shorter than the original message content.

Output your summary within <summary> tags.

Remember, the goal is to create a concise yet informative summary that captures the essence of the conversation.`,
        prompt: `
Here are the messages:
<messages>
${JSON.stringify(messages)}
</messages>`,
        temperature: 0.3,
        maxTokens: 512
    });

    return { role: "assistant", content: `This is a summary of past conversation messages between : ${text}` } as CoreMessage;
};

export const limitMessages = async (
    messages: CoreMessage[],
    limit: number = 6,
    summarizeRest: boolean = true
) => {
    if (messages.length <= limit) {
        return messages;
    }

    const newMessages: CoreMessage[] = [];
    if (summarizeRest && messages.length > limit) {
        // Summarize all messages that aren't in the recent messages (don't fall under the limit)
        const outOfContextMessages = messages.slice(
            0,
            Math.max(0, messages.length - limit)
        );
        if (outOfContextMessages && outOfContextMessages.length > 0) {
            const summary = await summarizeMessages(outOfContextMessages);
            newMessages.push(summary);
        }
    }

    // get the last (limit) number of messages in the conversation
    const recentMessages = messages.slice(-limit);
    newMessages.push(...recentMessages);

    console.log("\n## NEW MESSAGES ##")
    console.log(newMessages);
    console.log("\n\n")

    return newMessages;
};
