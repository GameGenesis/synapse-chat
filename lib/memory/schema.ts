import { z } from "zod";

const actionSchema = z.object({
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
});

export const memorySchema = z.object({
    innerThinking: z
        .string()
        .describe(
            "Use this property to think step by step on whether anything in the provided message constitutes a permanent memory."
        ),
    actions: z.array(actionSchema).describe("A list of actions to perform.")
});
