import { cosineSimilarity, generateObject } from "ai";
import { models, getModel } from "./model-provider";
import { z } from "zod";
import { generateEmbedding, generateEmbeddings } from "@/lib/utils/embeddings";
import User from "@/models/user";

export const extractMemory = async (message: string, userId: string) => {
    if (!message || !userId) {
        return;
    }

    const { object } = await generateObject({
        model: getModel(models.gpt4omini),
        system: `
You are an expert in memory analysis. You will be analyzing a message to identify any information that constitutes an important long-term memory to permanently store. Your task is to carefully consider the content, decide if any elements should be remembered for the long term, and if so, extract concise, descriptive, and relevant memories from the given message.

## Instructions
First, analyze the message step by step using innerThinking to determine if any information should be stored as a long-term memory. Consider whether any information is worth storing as a long-term memory. Follow the guidelines below.

### Step-by-Step Analysis (InnerThinking):
- Begin by carefully reading the message.
- Reflect on each piece of information, evaluating whether it is significant enough to be stored for the long term.
- Consider the potential future value of this information. Would it aid in decision-making or provide valuable context on the user later?

### Guidelines for identifying important long-term memories:
1. Focus on significant events, achievements, or milestones related to the user
2. Include important personal information (e.g., names, relationships, dates)
3. Capture unique experiences or notable changes in circumstances
4. Identify strong emotions, opinions, preferences, or impactful realizations
5. Extract factual information that may be useful in the future
6. Always remember information that the user specifically instructs the assistant to remember (e.g. "Remember that I'm allergic to eggs.")
7. Only remember realistic information, not hypotheticals
8. Ensure the user is speaking about their own life (usually using first person) and not providing general information about another unrelated public or imaginary figure

### Guidelines for formulating memories:
1. Be very concise and to the point, but descriptive
2. Focus on the most crucial information
3. Avoid unnecessary details
4. Use clear and straightforward language in a single sentence
5. Include generalizable types or tags for the memory in parentheses after the memory.

Each memory should be a single, clear sentence that captures the essence of the information. This information should be related to the user and the user's circumstances. Do not include multiple separate pieces of information in one memory.

### Examples of InnerThinking
- This message mentions that John graduated. Graduation is a significant milestone, so this should be stored.
- The message talks about John's good mood today, but this isn't crucial for long-term memory, so I'll skip it.
- The detail about John's new job in San Francisco is relevant for his future career path, so it should be captured.

### Examples of good memory extractions:
- User's name is John (personal).
- John got married to Sarah on June 15, 2023 (relationships, family).
- Graduated from Harvard University with a degree in Computer Science (education).
- Moved to a new city, San Francisco, for a job at Google (career, professional life).
- Daughter has a milk allergy (dietary, allergy).
- Enjoys working out at the gym (lifestyle, hobby, interest).
- Doesn't trust BBC News (preference, opinion, news, search).

### Examples of bad memory extractions:
- John did some stuff. (Too vague)
- Ryan Reynolds was born on October 23, 1976. (Not related to the user - unless the user is Ryan Reynolds)
- John is feeling good today. (Not relevant for long-term memory)
- John got married to Sarah on June 15, 2023, and they had a beautiful ceremony with 150 guests at a beachside resort. (Too detailed for a single memory and contains unnecessary information)
- User is a magical fairy princess. (Not realistic or factual)

### Final Output Format:
- If no information in the message meets the criteria for long-term memory, return an empty array.
- If important information is identified, output an array containing each extracted memory as a single, clear sentence.
- Preferably extract a maximum of one to two important memories per message.

Remember, the goal is to store only truly significant information that may be valuable for future reference or decision-making.
`,
        schema: z.object({
            innerThinking: z
                .string()
                .describe(
                    "Use this property to think step by step on whether anything in the provided message constitutes a permanent memory."
                ),
            memories: z
                .array(z.string())
                .describe(
                    "The information to store as a memory or memories. Keep this brief, concise, but descriptive. Include generalizable types or tags for the memory (e.g. hobby, dietary, etc.) in parenthesis. "
                )
        }),
        prompt: message,
        temperature: 0.3,
        maxTokens: 512
    });

    const memories = object.memories;

    if (!memories || memories.length === 0) {
        return;
    }

    console.log("MEMORY UPDATED: ", memories.join(", "));

    const embeddedMemories = await generateEmbeddings(memories);

    // Store memories in the database
    try {
        await User.findByIdAndUpdate(
            userId,
            { $push: { memories: { $each: embeddedMemories } } },
            { new: true }
        );
    } catch (error) {
        console.warn(`Encountered error while trying to store extracted memory: ${error}`)
    }

    return embeddedMemories;
};

export const findRelevantMemories = async (
    userQuery: string,
    userId: string,
    limit: number = 4,
    similarityThreshold: number = 0.3
) => {
    const userQueryEmbedding = await generateEmbedding(userQuery);

    let user = null;

    try {
        user = await User.findById(userId);
    } catch(error) {
        console.warn(`Error retrieving user: ${error}`);
    }

    if (!user) {
        console.warn(`User not found for ID: ${userId}`);
        return [];
    }

    if (!user.memories || user.memories.length === 0) {
        console.log(`No memories found for user: ${userId}`);
        return [];
    }

    const memories = user.memories.map((memory: any) => ({
        content: memory.content,
        embedding: memory.embedding,
        similarity: cosineSimilarity(userQueryEmbedding, memory.embedding)
    }));

    const relevantMemories = memories
        .filter((memory: any) => memory.similarity > similarityThreshold)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit);

    return relevantMemories.map((memory: any) => memory.content);
};
