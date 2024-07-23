import {
    artifactPrompt,
    assistantPrompt,
    imageSafetyPrompt,
    safetyPrompt
} from "./config";

const buildPrompt = (
    enableArtifacts: boolean,
    enableDefaultPrompt: boolean,
    enableSafeguards: boolean,
    customInstructions?: string
) => {
    let defaultPrompt = ""
    if (enableDefaultPrompt) {
        defaultPrompt = assistantPrompt.replace(
            "{{SAFEGUARDS}}",
            enableSafeguards ? safetyPrompt.trim() : ""
        )
    }
    
    return `${enableArtifacts ? artifactPrompt : ""}${defaultPrompt}\n${enableSafeguards ? imageSafetyPrompt.trim() : ""}${
        customInstructions ?
        `\n---\n<custom_user_instructions>${customInstructions}</custom_user_instructions>` : ""
    }`;
};

export default buildPrompt;
