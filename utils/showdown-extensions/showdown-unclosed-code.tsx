import { ShowdownExtension } from "showdown";

const showdownUnclosedCode: ShowdownExtension = {
    type: "lang",
    filter: function (text: string) {
        // Regex to match unclosed code blocks with a specified language
        const unclosedCodeBlockRegex =
            /```(\w+)\s*\n([\s\S]+?)(?:$|(?=\n```))/g;

        let lastIndex = 0;
        let result = "";

        let match;
        while ((match = unclosedCodeBlockRegex.exec(text)) !== null) {
            const [fullMatch, language, code] = match;
            const matchStart = match.index;
            const matchEnd = matchStart + fullMatch.length;

            // Add the text between the last match and this one
            result += text.slice(lastIndex, matchStart);

            // Check if this block is already closed
            if (code.trim().endsWith("```")) {
                result += fullMatch;
            } else {
                // Trim any trailing newlines from the code
                const trimmedCode = code.replace(/\n+$/, "");

                // Close the code block
                result += `\`\`\`${language}\n${trimmedCode}\n\`\`\``;
            }

            lastIndex = matchEnd;
        }

        // Add any remaining text after the last match
        result += text.slice(lastIndex);

        return result;
    }
};

export default showdownUnclosedCode;
