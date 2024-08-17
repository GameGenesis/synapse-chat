import { embeddingModel } from "./model-provider";
import { cosineSimilarity, embed, embedMany } from "ai";
import User from "@/models/user";

export const generateEmbeddings = async (
    values: string[]
): Promise<Array<{ content: string; embedding: number[] }>> => {
    const { embeddings } = await embedMany({
        model: embeddingModel,
        values
    });

    return embeddings.map((embedding, i) => ({
        content: values[i],
        embedding
    }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll("\\n", " ");
    const { embedding } = await embed({
        model: embeddingModel,
        value: input
    });
    return embedding;
};

export const findRelevantMemories = async (
    userQuery: string,
    userId: string,
    limit: number = 4,
    similarityThreshold: number = 0.3
) => {
    const userQueryEmbedding = await generateEmbedding(userQuery);

    const user = await User.findById(userId);
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
