import { Marked, Renderer } from "marked";
import katex from "katex";
import hljs from "highlight.js";
import { markedHighlight } from "marked-highlight";
import purify from "dompurify";

// Extend the marked.Renderer to support custom rendering
class CustomRenderer extends Renderer {
    // Override the code method to handle KaTeX math blocks
    code({ text, lang, escaped }: any) {
        if (lang === "math") {
            return katex.renderToString(text, {
                throwOnError: false,
                displayMode: true
            });
        }
        return super.code(text);
    }

    // Override the codespan method to handle inline KaTeX
    codespan({ text }: any) {
        if (text.startsWith("$") && text.endsWith("$")) {
            return katex.renderToString(text.slice(1, -1), {
                throwOnError: false,
                displayMode: false
            });
        }
        return super.codespan(text);
    }
}

const marked = new Marked(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        }
    })
);

// Configure marked options
marked.use({
    renderer: new CustomRenderer(),
    gfm: true,
    breaks: true
});

// Add support for GitHub Flavored Markdown
marked.use({
    extensions: [
        {
            name: "task-list",
            level: "block",
            start(src) {
                return src.match(/^\s*[-*] \[[ xX]\]/)?.index;
            },
            tokenizer(src, tokens) {
                const rule = /^\s*[-*] \[( |x|X)\] (.+)/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: "task-list",
                        raw: match[0],
                        checked: match[1].toLowerCase() === "x",
                        text: match[2]
                    };
                }
            },
            renderer(token) {
                return `<li class="task-list-item"><input type="checkbox" ${
                    token.checked ? "checked" : ""
                } disabled> ${marked.parseInline(token.text)}</li>`;
            }
        }
    ]
});

async function markdownToHtml(markdown: string): Promise<string> {
    // Parse the markdown and return HTML
    const html = await marked.parse(markdown);
    return purify.sanitize(html);
}

export default markdownToHtml;