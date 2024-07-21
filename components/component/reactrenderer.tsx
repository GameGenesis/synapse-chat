import React, { useState } from "react";
import * as Recharts from "recharts";
import * as LucideIcons from "lucide-react";
import * as RadixIcons from "@radix-ui/react-icons";
import * as ShadcnComponents from "@/components/ui";
import { Runner } from "react-runner";
import ErrorMessage from "./errormessage";

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
            "@/components/ui/dialog": ShadcnComponents,
            "@/components/ui/dropdown-menu": ShadcnComponents,
            "@/components/ui/sheet": ShadcnComponents,
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
                <ErrorMessage title="React Rendering Error" message={error} />
            )}
        </div>
    );
};
