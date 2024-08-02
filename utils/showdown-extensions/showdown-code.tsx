import showdown from "showdown";
import hljs from "highlight.js";

const showdownCode: showdown.ShowdownExtension = {
    type: "output",
    filter: (text: string) => {
        const codeRegex =
            /<pre><code\s+class="([^"]+)">([\s\S]*?)<\/code><\/pre>/g;
        return text.replace(
            codeRegex,
            (match, language: string, code: string) => {
                const lang = language.split("language-")[1] || "plaintext";
                const highlightedCode = hljs.highlight(code.trim(), {
                    language: lang
                }).value;

                return `
        <div class="code-block-wrapper relative rounded-md overflow-hidden">
          <div class="flex justify-between items-center px-4 py-2 text-sm !bg-gray-800">
            <span class="text-gray-300">${lang}</span>
            <button class="copy-code-button text-[#abb2bf] hover:text-white transition-colors duration-200">
              Copy code
            </button>
          </div>
          <pre class="!m-0 !p-4 !bg-[#282c34]"><code class="hljs ${lang}">${highlightedCode}</code></pre>
        </div>
      `;
            }
        );
    }
};

export default showdownCode;
