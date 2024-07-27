import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import ErrorMessage from "./errormessage";
import { LoadingSpinner } from "./icons";

const Runner = dynamic(() => import("react-runner").then((mod) => mod.Runner), {
    ssr: false
});

interface Props {
    code: string;
}

export const ReactRenderer = ({ code }: Props) => {
    const [error, setError] = useState<string | undefined>();
    const [scope, setScope] = useState<any>(null);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const [
                    React,
                    Recharts,
                    LucideIcons,
                    RadixIcons,
                    ShadcnComponents,
                    Mathjs
                ] = await Promise.all([
                    import("react"),
                    import("recharts"),
                    import("lucide-react"),
                    import("@radix-ui/react-icons"),
                    import("@/components/ui"),
                    import("mathjs")
                ]);

                const IMPORT_MAP: { [key: string]: any } = {
                    react: React,
                    recharts: Recharts,
                    "lucide-react": LucideIcons,
                    "@radix-ui/react-icons": RadixIcons,
                    "@/components/ui": ShadcnComponents,
                    mathjs: Mathjs
                };

                // Add specific ShadcnComponents imports
                Object.keys(ShadcnComponents).forEach((component) => {
                    IMPORT_MAP[`@/components/ui/${component.toLowerCase()}`] =
                        ShadcnComponents;
                });

                setScope({
                    React,
                    ...React,
                    ...Recharts,
                    ...LucideIcons,
                    ...RadixIcons,
                    ...ShadcnComponents,
                    ...Mathjs,
                    import: IMPORT_MAP
                });
            } catch (err) {
                setError("Failed to load dependencies");
                console.error("Failed to load dependencies:", err);
            }
        };

        loadDependencies();
    }, []);

    // Remove backticks and language tag only if they're at the start or end of the code
    const processedCode = code.replace(/^```[\w-]*\n|\n```$/g, "").trim();

    if (error) {
        return (
            <ErrorMessage title="Dependency Loading Error" message={error} />
        );
    }

    return (
        <Suspense fallback={<LoadingSpinner />}>
            {scope ? (
                <Runner
                    code={processedCode}
                    scope={scope}
                    onRendered={(e) => setError(e?.message)}
                />
            ) : (
                <LoadingSpinner />
            )}
            {error && (
                <ErrorMessage title="React Rendering Error" message={error} />
            )}
        </Suspense>
    );
};
