const showdownCode: showdown.ShowdownExtension = {
    type: 'output',
    filter: (text: string) => {
      const codeRegex = /<pre><code\s+class="([^"]+)">([\s\S]*?)<\/code><\/pre>/g;
      return text.replace(codeRegex, (match, language, code) => {
        return `
          <div class="code-block-wrapper relative rounded-md overflow-hidden bg-[#1e1e1e] text-white">
            <div class="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 text-sm">
              <span class="text-gray-400">${language.replace('language-', '')}</span>
              <button onclick="window.copyToClipboard(\`${code.replace(/`/g, '\\`')}\`)" class="copy-code-button text-gray-400 hover:text-white transition-colors duration-200">
                Copy code
              </button>
            </div>
            <pre style="margin: 0; border-radius: 0; padding: 1rem;"><code class="${language}">${code}</code></pre>
          </div>
        `;
      });
    }
  };

export default showdownCode;