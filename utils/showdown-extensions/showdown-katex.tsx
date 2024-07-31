// Source: https://obedm503.github.io/showdown-katex/
import katex from "katex";

const showdownKatex = (options = {}) => {
    const defaults = {
        throwOnError: false,
        errorColor: "#ff0000",
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "```math", right: "```", display: true },
            { left: "$", right: "$", display: false }
        ]
    };

    const config = { ...defaults, ...options };

    return [
        {
            type: "lang",
            filter: function (text: string) {
                config.delimiters.forEach(({ left, right, display }) => {
                    const escapedLeft = left.replace(/\$/g, "¨D");
                    const escapedRight = right.replace(/\$/g, "¨D");
                    const regex = new RegExp(
                        `${escapedLeft}([^¨D]+?)${escapedRight}`,
                        "g"
                    );

                    text = text.replace(regex, (match, content) => {
                        try {
                            const unescapedContent = content
                                .trim()
                                .replace(/¨D/g, "$")
                                .replace(/¨T/g, "¨")
                                .replace(/\r/g, "\n");
                            return katex.renderToString(unescapedContent, {
                                displayMode: display,
                                throwOnError: config.throwOnError,
                                errorColor: config.errorColor
                            });
                        } catch (error) {
                            if (config.throwOnError) {
                                throw error;
                            }
                            return `<span style="color: ${config.errorColor};">${error}</span>`;
                        }
                    });
                });
                return text;
            }
        }
    ];
};

export default showdownKatex;
