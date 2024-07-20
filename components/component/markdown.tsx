import { CodeProps } from "@/types";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { xonokai } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useState } from "react";

export const CustomMarkdown = ({
    children,
    className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 3000);
        });
    };

    return (
        <div className={`markdown-body prose max-w-full ${className}`}>
            <Markdown
                className="prose"
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => (
                        <h1
                            className="text-2xl font-bold my-4 pb-2 border-b"
                            {...props}
                        />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2
                            className="text-2xl font-semibold my-3 pb-1 border-b"
                            {...props}
                        />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-semibold my-2" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className="text-lg font-medium my-2" {...props} />
                    ),
                    h5: ({ node, ...props }) => (
                        <h5 className="text-base font-medium my-1" {...props} />
                    ),
                    h6: ({ node, ...props }) => (
                        <h6 className="text-sm font-medium my-1" {...props} />
                    ),
                    code({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                    }: CodeProps) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <div className="code-block-wrapper relative rounded-md overflow-hidden">
                                <div className="flex justify-between items-center bg-gray-800 text-gray-200 px-4 py-2">
                                    <span className="text-sm font-mono">
                                        {match[1]}
                                    </span>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(String(children))
                                        }
                                        className="text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                                    >
                                        {copiedCode === String(children)
                                            ? "Copied!"
                                            : "Copy"}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    language={match[1]}
                                    style={xonokai}
                                    PreTag="div"
                                    className="!m-0"
                                >
                                    {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {typeof children === "string" ? children : children?.toString()}
            </Markdown>
        </div>
    );
};
