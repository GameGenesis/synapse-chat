import hljs from "highlight.js";

// Register custom aliases
hljs.registerAliases(["latex", "tex", "math"], { languageName: "latex" });
hljs.registerAliases(["racket", "scheme"], { languageName: "scheme" });

// Cache for highlighted code
const highlightCache = new Map<string, string>();

export const highlightCode = (code: string, language: string) => {
    let value;
    try {
        value = hljs.highlight(code, { language }).value;
    } catch (error) {
        console.warn(
            `Failed to highlight with language ${language}. Falling back to auto-detection.`
        );

        if (highlightCache.has(language)) {
            const detectedLang = highlightCache.get(language)!;
            value = hljs.highlight(code, { language: detectedLang }).value;
        } else {
            const highlight = hljs.highlightAuto(code);
            value = highlight.value;

            if (highlight.language) {
                language = highlight.language;
                highlightCache.set(language, language);
            }
        }
    }
    return { value, language };
};