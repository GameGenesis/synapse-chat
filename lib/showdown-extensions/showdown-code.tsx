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

                const extensionMap: { [key: string]: string } = {
                    typescript: "ts",
                    javascript: "js",
                    python: "py",
                    java: "java",
                    cpp: "cpp",
                    csharp: "cs",
                    html: "html",
                    css: "css",
                    jsx: "jsx",
                    tsx: "tsx",
                    json: "json",
                    yaml: "yaml",
                    markdown: "md",
                    plaintext: "txt"
                };

                const fileExtension = extensionMap[detectedLang] || "txt";

                return `
<div class="code-block" data-extension="${fileExtension}">
  <div class="code-header">
    <span class="code-lang">${detectedLang}</span>
    <div class="flex gap-2">
      <button class="copy-code-button inline-flex items-center hover:bg-gray-600 p-1.5 rounded-md" title="Copy code">
        <svg class="copy-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        <span class="button-text hidden">Copy code</span>
      </button>
      <button class="download-code-button inline-flex items-center hover:bg-gray-600 p-1.5 rounded-md" title="Download code">
        <svg class="download-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        <span class="button-text hidden">Download</span>
      </button>
    </div>
  </div>
  <pre class="code-pre"><code class="hljs ${detectedLang}">${highlightedCode}</code></pre>
</div>`;
            }
        );
    }
};

export default showdownCode;
