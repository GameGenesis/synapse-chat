import hljs from "highlight.js";

// Register custom aliases
hljs.registerAliases(["latex", "tex", "math"], { languageName: "latex" });
hljs.registerAliases(["racket", "scheme"], { languageName: "scheme" });

// Cache for highlighted code
const highlightCache = new Map<string, string>();

export const highlightCode = (code: string, language: string) => {
    // Check if the language exists in highlight.js
    const isLanguageSupported = hljs.getLanguage(language) !== undefined;
    let value;

    try {
        if (isLanguageSupported) {
            value = hljs.highlight(code, { language }).value;
        } else if (highlightCache.has(language)) {
            // If we've seen this unknown language before, use the cached detection
            language = highlightCache.get(language)!;
            value = hljs.highlight(code, { language }).value;
        } else {
            // For unknown languages, use auto-detection
            const highlight = hljs.highlightAuto(code);
            value = highlight.value;

            if (highlight.language) {
                language = highlight.language;
                highlightCache.set(language, highlight.language);
            } else {
                // If auto-detection fails, fallback to plaintext
                language = "plaintext";
                value = hljs.highlight(code, { language }).value;
            }
        }
    } catch (error) {
        language = "plaintext";
        value = hljs.highlight(code, { language }).value;
    }

    return { value, language };
};
