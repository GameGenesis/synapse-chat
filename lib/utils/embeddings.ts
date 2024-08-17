import { embeddingModel } from "./model-provider";
import { embed, embedMany } from "ai";

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
