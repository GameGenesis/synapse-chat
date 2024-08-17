import { cosineSimilarity, generateObject } from "ai";
import { models, getModel } from "./model-provider";
import { z } from "zod";
import { generateEmbedding, generateEmbeddings } from "@/lib/utils/embeddings";
import User from "@/models/user";
import { date } from "@/app/api/chat/config";

export const extractMemory = async (message: string, userId: string) => {
    if (!message || !userId) {
        return;
    }

    // Fetch existing memories
    const user = await User.findById(userId);
    if (!user) {
        console.warn(`User not found for ID: ${userId}`);
        return;
    }

    const existingMemories = user.memories.map((memory: any) => ({
        id: memory._id,
        content: memory.content
    }));

    const { object } = await generateObject({
        model: getModel(models.gpt4omini),
        system: `
You are an expert in memory analysis and management. You will be analyzing a message to identify any information that constitutes an important long-term memory to permanently store or update.
You will decide whether to create new memories, update existing ones, or delete outdated ones based on the content of the message. You have access to the user's existing memories for context. Carefully consider the content, decide if any elements should be remembered for the long term, and if so, extract concise, descriptive, and relevant memories from the given message.

## Instructions
First, analyze the message step by step using innerThinking to determine whether any information is worth storing as a long-term memory. Follow the guidelines below.

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

### Decide the action to take:
- \'create\': If it's new, important information not present in existing memories.
- \'update\': If it contradicts or significantly adds to an existing memory. Updating a memory completely replaces it so it is important that this is a notable change that completely replaces the old memory.
- \'delete\': If it explicitly states that previous information is no longer true. Make sure to only delete relevant memories as this is a permanent change. This is very important.
- No Action: If the information is already present or not important enough to store.

### Guidelines for formatting actions:
For each action, provide the following:
- Action type: \'create\', \'update\', or \'delete\'
- Content: The memory content (for create and update actions)
- Target ID: The existing memory id to update or delete (for update and delete actions)

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
- If no information in the message meets the criteria for a long-term memory action, return an empty array.
- If important information is identified, output an array containing each action.
- Preferably extract a maximum of one to two important memories per message. The extracted memory or memories should be a single, clear sentence with the corresponding tags in parentheses.

The current date is ${date}.
Remember, the goal is to store only truly significant information that may be valuable for future reference or decision-making in the format "Content (tags)".
`,
        schema: z.object({
            innerThinking: z
                .string()
                .describe(
                    "Use this property to think step by step on whether anything in the provided message constitutes a permanent memory."
                ),
            actions: z.array(
                z.object({
                    type: z.enum(["create", "update", "delete"]),
                    content: z
                        .string()
                        .optional()
                        .describe(
                            "Include this if the action type is `create` or `update`. The new or updated information to store as a memory. Keep this brief, concise, but descriptive. Include generalizable types or tags for the memory (e.g. hobby, dietary, etc.) in parenthesis. "
                        ),
                    targetID: z
                        .string()
                        .optional()
                        .describe(
                            "Include this if the action type is `delete` or `update`. This is the id of the memory to be updated or deleted."
                        )
                })
            )
        }),
        prompt: `
Here is the message to analyze:
<message>
${message}
</message>

For context, here are the user's existing memories and their \`id\`s:
<existing_memories>
${JSON.stringify(existingMemories)}
</existing_memories>

Analyze the message and, if necessary, decide which memories to create, update, or delete based on the existing memories and the new information provided.
`,
        temperature: 0.3,
        maxTokens: 512
    });

    const actions = object.actions;

    if (!actions || actions.length === 0) {
        return;
    }

    console.log(JSON.stringify(actions));

    for (const action of actions) {
        switch (action.type) {
            case "create":
                if (action.content) {
                    await createMemory(userId, action.content);
                    console.log("Memory created:", action.content);
                }
                break;
            case "update":
                if (action.content && action.targetID) {
                        await updateMemory(
                            userId,
                            action.targetID,
                            action.content
                        );
                        console.log("Memory updated:", action.content);
                }
                break;
            case "delete":
                if (action.targetID) {
                        await deleteMemory(userId, action.targetID);
                        console.log("Memory deleted");
                }
                break;
        }
    }

    return actions;
};

export const findRelevantMemories = async (
    userQuery: string,
    userId: string,
    limit: number = 4,
    similarityThreshold: number = 0.25 // A number between -1 and 1 representing the cosine similarity threshold between the two vectors.
) => {
    const userQueryEmbedding = await generateEmbedding(userQuery);

    let user = null;

    try {
        user = await User.findById(userId);
    } catch (error) {
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

    // Sort memories by similarity in descending order
    const sortedMemories = memories.sort(
        (a: any, b: any) => b.similarity - a.similarity
    );

    // Filter memories above the threshold
    const relevantMemories = sortedMemories
        .filter((memory: any) => memory.similarity > similarityThreshold)
        .slice(0, limit);

    // If there are relevant memories above the threshold, return them
    if (relevantMemories.length > 0) {
        return relevantMemories.map((memory: any) => memory.content);
    }

    // If there are no memories above the threshold, check if there's at least one memory with similarity > 0
    const mostRelevantMemory = sortedMemories.find(
        (memory: any) => memory.similarity > 0
    );

    // If there's a memory with similarity > 0, return it; otherwise, return an empty array
    return mostRelevantMemory ? [mostRelevantMemory.content] : [];
};

export const createMemory = async (userId: string, content: string) => {
    if (!userId || !content) {
        throw new Error("User ID and memory content are required");
    }

    const embeddedMemory = await generateEmbeddings([content]);

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $push: { memories: embeddedMemory[0] } },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return embeddedMemory[0];
    } catch (error) {
        console.error(`Error creating memory: ${error}`);
        throw error;
    }
};

export const updateMemory = async (
    userId: string,
    memoryId: string,
    newContent: string
) => {
    if (!userId || !memoryId || !newContent) {
        throw new Error("User ID, memory ID, and new content are required");
    }

    const newEmbedding = await generateEmbedding(newContent);

    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, "memories._id": memoryId },
            {
                $set: {
                    "memories.$.content": newContent,
                    "memories.$.embedding": newEmbedding
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error("User or memory not found");
        }

        return { content: newContent, embedding: newEmbedding };
    } catch (error) {
        console.error(`Error updating memory: ${error}`);
        throw error;
    }
};

export const deleteMemory = async (userId: string, memoryId: string) => {
    if (!userId || !memoryId) {
        throw new Error("User ID and memory ID are required");
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { memories: { _id: memoryId } } },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return true;
    } catch (error) {
        console.error(`Error deleting memory: ${error}`);
        throw error;
    }
};
