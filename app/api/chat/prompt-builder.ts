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
    userPrompt?: string
) => {
    let defaultPrompt = ""
    if (enableDefaultPrompt) {
        defaultPrompt = assistantPrompt.replace(
            "{{SAFEGUARDS}}",
            enableSafeguards ? safetyPrompt.trim() : ""
        )
    }
    
    return `${enableArtifacts ? artifactPrompt : ""}${defaultPrompt}\n${enableSafeguards ? imageSafetyPrompt.trim() : ""}${
        userPrompt ?
        `\n---\n<user_system_prompt>${userPrompt}</user_system_prompt>` : ""
    }`;
};

export default buildPrompt;
