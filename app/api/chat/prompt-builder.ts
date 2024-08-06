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
    customInstructions?: string
) => {
    let defaultPrompt = ""
    if (enableDefaultPrompt) {
        defaultPrompt = assistantPrompt.replace(
            "{{SAFEGUARDS}}",
            enableSafeguards ? safetyPrompt.trim() : ""
        )
    }
    
    return `${enableArtifacts ? artifactPrompt : ""}${defaultPrompt}${useTools ? toolsPrompt : ""}${enableSafeguards ? imageSafetyPrompt.trim() : ""}${
        customInstructions ?
        `\n---\n<custom_user_instructions>${customInstructions}</custom_user_instructions>` : ""
    }`;
};

export default buildPrompt;
