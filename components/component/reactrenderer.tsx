import React, { useState, useEffect, Suspense, useCallback } from "react";
import { ErrorMessage } from "./errormessage";
import { LoadingSpinner } from "./icons";
import { Runner } from "react-runner";

interface Props {
    code: string;
    setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ReactRenderer = ({ code, setConsoleLogs }: Props) => {
    const [error, setError] = useState<string | undefined>();
    const [scope, setScope] = useState<any>(null);

    const customConsole = useCallback(
        (type: string) =>
            (...args: any[]) => {
                const formattedLog = `[${type.toUpperCase()}] ${args
                    .map((arg) =>
                        typeof arg === "object"
                            ? JSON.stringify(arg)
                            : String(arg)
                    )
                    .join(" ")}`;
                setConsoleLogs((prev) => [...prev, formattedLog]);
                (console as any)[type.toLowerCase()](...args);
            },
        [setConsoleLogs]
    );

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
                    import: IMPORT_MAP,
                    console: {
                        log: customConsole("LOG"),
                        warn: customConsole("WARN"),
                        error: customConsole("ERROR")
                    }
                });
            } catch (err) {
                setError("Failed to load dependencies");
                console.error("Failed to load dependencies:", err);
            }
        };

        loadDependencies();
    }, [customConsole]);

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
