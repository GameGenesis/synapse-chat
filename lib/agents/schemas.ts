import { z } from "zod";

// Define schemas
export const projectManagerSchema = z.object({
    innerThinking: z.string().optional(),
    taskList: z
        .array(
            z.object({
                agent: z.string(),
                instructions: z.string()
            })
        )
        .describe(
            "Only choose the agents that are relevant to the task. Keep within the scope of the described task. You may call on the same agent multiple times if required (for different tasks or as different persona). Keep in mind, final results should be formatted in markdown, plaintext, latex, or as code (you DO NOT need to delegate this as a separate task)."
        )
});

export const supervisorSchema = z.object({
    summary: z.string(),
        updatedContext: z.record(z.any()).optional(),
        nextSteps: z
        .string()
        .optional()
        .describe(
            "Describes the next steps to be performed for the project to be completed. Leave blank if the project has been completed and no further revisions are needed."
        ),
    needsRevision: z
        .boolean()
        .describe(
            "Set to true if the task needs to be revised by the project manager. This should only be the case if it is imperative that the current concerns be resolved or if you feel the project hasn't been completed successfully."
        )
});

export const programmerSchema = z.object({
    innerThinking: z.string().optional(),
    code: z.string(),
    comments: z.string().optional()
});

export const debuggerSchema = z.object({
    innerThinking: z.string().optional(),
    bugs: z.array(z.string()).optional(),
    edgeCases: z.array(z.string()).optional(),
    comments: z.string().optional()
});

export const writerSchema = z.object({
    innerThinking: z.string().optional(),
    content: z.string()
});

export const researcherSchema = z.object({
    innerThinking: z.string().optional(),
    research: z.string().describe("Include sources"),
    sources: z.string().describe("Include the full list of sources including any additional sources that might be helpful.")
});

export const verifierSchema = z.object({
    innerThinking: z.string().optional(),
    issues: z.array(z.string()).describe("A list of issues (e.g. incorrect or missing information)"),
    comments: z.string().describe("Any additional comments.")
});

export const inquisitorSchema = z.object({
    innerThinking: z.string().optional(),
    connections: z.array(z.string()).describe("A list of connections, related topics, etc."),
    relatedQuestions: z.array(z.string()).describe("A list of related questions to explore the topic deeper"),
});