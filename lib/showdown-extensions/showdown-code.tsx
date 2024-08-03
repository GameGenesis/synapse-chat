import showdown from "showdown";
import hljs from "highlight.js";

const decodeHTMLEntities = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.innerHTML = text;
    return textArea.value;
};

const showdownCode: showdown.ShowdownExtension = {
    type: "output",
    filter: (text: string) => {
        const codeRegex =
            /<pre><code\s+class="([^"]+)">([\s\S]*?)<\/code><\/pre>/g;
        return text.replace(
            codeRegex,
            (match, language: string, code: string) => {
                const decodedCode = decodeHTMLEntities(code);
                const lang = language.split("language-")[1] || "plaintext";
                let highlightedCode = decodedCode;

                try {
                    highlightedCode = hljs.highlight(decodedCode.trim(), {
                        language: lang
                    }).value;
                } catch {
                    highlightedCode = hljs.highlightAuto(
                        decodedCode.trim()
                    ).value;
                }

                return `
<div class="code-block">
  <div class="code-header">
    <span class="code-lang">${lang}</span>
    <button class="copy-code-button">
      Copy code
    </button>
  </div>
  <pre class="code-pre"><code class="hljs ${lang}">${highlightedCode}</code></pre>
</div>
    `;
            }
        );
    }
};

export default showdownCode;
