import {
    artifactPrompt,
    assistantPrompt,
    toolsPrompt,
    imageSafetyPrompt,
    safetyPrompt
} from "./config";

const buildPrompt = (
    enableArtifacts: boolean,
    enableDefaultPrompt: boolean,
    enableSafeguards: boolean,
    useTools: boolean,
    memories?: string[],
    customInstructions?: string
) => {
    let defaultPrompt = "";
    if (enableDefaultPrompt) {
        defaultPrompt = assistantPrompt.replace(
            "{{SAFEGUARDS}}",
            enableSafeguards ? safetyPrompt.trim() : ""
        );
    }

    const memoriesPrompt =
        memories && memories.length > 0
            ? `
You will be provided a list of the most relevant memories to the user's prompt. These memories describe the user, their interactions, feelings, preferences, accomplishments, and relationships.
This list of memories may or may not be directly useful in answering the question, but they can help make the interaction more personalized and dynamic.
If the memories don't directly answer the prompt, you may use them to personalize your response or add context that makes the conversation more engaging and tailored to the user.
<relevant_memories>
${memories.join("\n")}
<relevant_memories>
`
            : "";

    console.log(memoriesPrompt);

    return `${enableArtifacts ? artifactPrompt : ""}${defaultPrompt}${
        useTools ? toolsPrompt : ""
    }${memoriesPrompt}${enableSafeguards ? imageSafetyPrompt.trim() : ""}${
        customInstructions
            ? `\n---\n<custom_user_instructions>${customInstructions}</custom_user_instructions>`
            : ""
    }`;
};

export default buildPrompt;
