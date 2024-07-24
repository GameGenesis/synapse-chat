import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import ErrorMessage from "./errormessage";

interface Props {
    code: string;
}

const DynamicRunner = dynamic(
    () => import("react-runner").then((mod) => mod.Runner),
    {
        ssr: false
    }
);

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
    </div>
);

export const ReactRenderer: React.FC<Props> = ({ code }) => {
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
                    ShadcnComponents
                ] = await Promise.all([
                    import("react"),
                    import("recharts"),
                    import("lucide-react"),
                    import("@radix-ui/react-icons"),
                    import("@/components/ui")
                ]);

                const IMPORT_MAP: { [key: string]: any } = {
                    react: React,
                    recharts: Recharts,
                    "lucide-react": LucideIcons,
                    "@radix-ui/react-icons": RadixIcons,
                    "@/components/ui": ShadcnComponents
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
                <DynamicRunner
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
