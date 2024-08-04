import showdown from "showdown";
import { decodeHTML } from "@/lib/utils/decode-html";
import { highlightCode } from "@/lib/utils/highlight";

const showdownCode: showdown.ShowdownExtension = {
    type: "output",
    filter: (text: string) => {
        const codeRegex =
            /<pre><code\s+class="([^"]+)">([\s\S]*?)<\/code><\/pre>/g;
        return text.replace(
            codeRegex,
            (match, language: string, code: string) => {
                const decodedCode = decodeHTML(code).trim();
                const lang = language.split("language-")[1] || "plaintext";

                const { value: highlightedCode, language: detectedLang } =
                    highlightCode(decodedCode, lang);

                return `
<div class="code-block">
  <div class="code-header">
    <span class="code-lang">${detectedLang}</span>
    <button class="copy-code-button">Copy code</button>
  </div>
  <pre class="code-pre"><code class="hljs ${detectedLang}">${highlightedCode}</code></pre>
</div>`;
            }
        );
    }
};

export default showdownCode;
