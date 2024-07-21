import {
    artifactPrompt,
    assistantPrompt,
    imageSafetyPrompt,
    safetyPrompt
} from "./config";

const buildPrompt = (
    enableArtifacts: boolean,
    enableSafeguards: boolean,
    userPrompt?: string
) => {
    return `${enableArtifacts && artifactPrompt}${assistantPrompt.replace(
        "{{SAFEGUARDS}}",
        enableSafeguards ? safetyPrompt : ""
    )}\n${enableSafeguards && imageSafetyPrompt}${
        userPrompt &&
        `\n---\n<user_system_prompt>${userPrompt}</user_system_prompt>`
    }`;
};

export default buildPrompt;
