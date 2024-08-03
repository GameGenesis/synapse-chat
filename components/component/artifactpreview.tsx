import { Artifact } from "@/types";
import { memo } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "./icons";

const ErrorMessage = dynamic(
    () => import("./errormessage").then((mod) => mod.ErrorMessage),
    {
        loading: () => <LoadingSpinner />,
        ssr: false
    }
);

const CustomMarkdown = dynamic(
    () => import("./markdown").then((mod) => mod.CustomMarkdown),
    {
        loading: () => <LoadingSpinner />,
        ssr: false
    }
);

const ReactRenderer = dynamic(
    () => import("./reactrenderer").then((mod) => mod.ReactRenderer),
    {
        loading: () => <LoadingSpinner />,
        ssr: false
    }
);

const Mermaid = dynamic(() => import("./mermaid").then((mod) => mod.Mermaid), {
    loading: () => <LoadingSpinner />,
    ssr: false
});

interface Props {
    artifact: Artifact;
    setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
    html: string;
    iframeRef: React.RefObject<HTMLIFrameElement>;
}

export const PreviewComponent = memo(
    ({ artifact, setConsoleLogs, html, iframeRef }: Props) => {
        if (!artifact) return null;

        switch (artifact.type) {
            case "image/svg+xml":
                return (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: artifact.content || ""
                        }}
                    />
                );
            case "text/html":
                return (
                    <iframe
                        ref={iframeRef}
                        srcDoc={artifact.content}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none"
                        }}
                        title={artifact.title || "Preview"}
                        sandbox="allow-scripts allow-same-origin"
                    />
                );
            case "application/react":
                try {
                    return (
                        <ReactRenderer
                            code={artifact.content || ""}
                            setConsoleLogs={setConsoleLogs}
                        />
                    );
                } catch (error) {
                    return (
                        <ErrorMessage
                            title="React Component Error"
                            message="An error occurred while trying to display the React component. Please check the component code for any issues."
                        />
                    );
                }
            case "application/mermaid":
                try {
                    return <Mermaid chart={artifact.content || ""} />;
                } catch (error) {
                    return (
                        <ErrorMessage
                            title="Diagram Error"
                            message="An error occurred while trying to display the Mermaid diagram. Please verify the diagram syntax."
                        />
                    );
                }
            case "text/markdown":
                return (
                    <CustomMarkdown
                        className="h-full px-4 overflow-y-auto"
                        html={html || artifact.content || ""}
                    />
                );
            default:
                return (
                    <ErrorMessage
                        title="Unsupported Artifact"
                        message={`The artifact type "${artifact.type}" is not supported.`}
                    />
                );
        }
    }
);
PreviewComponent.displayName = "PreviewComponent";
