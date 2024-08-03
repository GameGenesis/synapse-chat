import { memo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = memo(({ inline, match, className, children, props }: any) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 3000);
        });
    };

    return !inline && match ? (
        <div className="code-block-wrapper relative rounded-md overflow-hidden bg-[#1e1e1e] text-white">
            <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 text-sm">
                <span className="text-gray-400">{match[1]}</span>
                <button
                    onClick={() => copyToClipboard(String(children))}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                    {copiedCode === String(children) ? "Copied!" : "Copy code"}
                </button>
            </div>
            <SyntaxHighlighter
                language={match[1]}
                style={vscDarkPlus}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    padding: "1rem"
                }}
            >
                {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
});
CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
