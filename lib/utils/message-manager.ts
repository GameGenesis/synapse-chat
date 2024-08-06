import { CoreMessage, generateText } from "ai";
import { getModel, models } from "./model-provider";

// TODO: Add a toggle in the settings to turn on message limits and summarization
// Add error handling
// Possibly call this summarization after the assistant message instead of before

const MAX_SUMMARY_LENGTH_WORDS = 50;

const summarizeMessages = async (messages: CoreMessage[]) => {
    const { text } = await generateText({
        model: getModel(models.llama31_8b),
        system: `
You will be given a series of messages within <messages> tags from a conversation between a user and an AI assistant. Some of these messages are previous summaries of the conversation. Your task is to provide a concise summary of these messages.

Please summarize the conversation above in no more than ${MAX_SUMMARY_LENGTH_WORDS} words. Make sure to include key information and main points discussed. Your summary must be shorter than the original message content.

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
    const content = `This is a summary of past conversation messages between the user and assistant:\n${text}`;
    console.log(content);

    return { role: "assistant", content } as CoreMessage;
};

// When summarizing, usually takes around 1s (0.9s - 1.5s) to process with gpt-4o-mini
// When summarizing, usually takes around 0.5s (0.3s - 1s) to process with Groq Llama 3.1 8B
export const limitMessages = async (
    messages: CoreMessage[],
    limit: number = 6,
    summarizeRest: boolean = true,
    summary_threshold: number = 1
) => {
    const startTime = performance.now()
    if (messages.length <= limit) {
        return messages;
    }

    let thresholdLimit = summarizeRest ? limit + summary_threshold : limit;

    const newMessages: CoreMessage[] = [];
    if (summarizeRest && messages.length > thresholdLimit) {
        // Summarize all messages that aren't in the recent messages (don't fall under the limit)
        const outOfContextMessages = messages.slice(
            0,
            Math.max(0, messages.length - limit)
        );
        if (outOfContextMessages && outOfContextMessages.length > 0) {
            const summary = await summarizeMessages(outOfContextMessages);
            newMessages.push(summary);
        }
        thresholdLimit--;
    }

    // get the last (limit) number of messages in the conversation
    const recentMessages = messages.slice(-thresholdLimit);
    newMessages.push(...recentMessages);

    const endTime = performance.now()
    console.log(`Call to limitMessages took ${endTime - startTime} milliseconds`)

    return newMessages;
};
