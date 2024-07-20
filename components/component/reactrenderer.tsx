import React, { useState } from "react";
import * as Recharts from "recharts";
import * as LucideIcons from "lucide-react";
import * as RadixIcons from "@radix-ui/react-icons";
import * as ShadcnComponents from "@/components/ui";
import { Runner } from "react-runner";

export const ReactRenderer = ({ code }: { code: string }) => {
    const [error, setError] = useState<string | undefined>("");

    const scope = {
        React,
        ...React,
        ...Recharts,
        ...LucideIcons,
        ...RadixIcons,
        ...ShadcnComponents,
        import: {
            react: React,
            recharts: Recharts,
            "lucide-react": LucideIcons,
            "@radix-ui/react-icons": RadixIcons,
            "@/components/ui": ShadcnComponents,
            "@/components/ui/avatar": ShadcnComponents,
            "@/components/ui/button": ShadcnComponents,
            "@/components/ui/card": ShadcnComponents,
            "@/components/ui/tabs": ShadcnComponents,
            "@/components/ui/textarea": ShadcnComponents
        }
    };

    // Remove backticks and language tag only if they're at the start or end of the code
    let processedCode = code.replace(/^```[\w-]*\n|\n```$/g, "").trim();

    return (
        <div>
            <Runner
                code={processedCode}
                scope={scope}
                onRendered={(e) => setError(e?.message)}
            />
            {error && (
                <div className="text-red-500 text-wrap overflow-y-auto mx-2">
                    Error: {error}
                </div>
            )}
        </div>
    );
};
