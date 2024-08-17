"use client";

import { useEffect, useState } from "react";
import PreviewComponent from "./artifactpreview";
import { Artifact } from "@/lib/types";

interface Props {
    id: string;
}

const SharedArtifactComponent = ({ id }: Props) => {
    const [artifact, setArtifact] = useState<Artifact | null>(null);

    useEffect(() => {
        const fetchArtifact = async () => {
            try {
                const response = await fetch(`/api/artifacts/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setArtifact(data);
                } else {
                    console.error("Failed to fetch artifact");
                }
            } catch (error) {
                console.error("Error fetching artifact:", error);
            }
        };

        fetchArtifact();
    }, [id]);

    if (!artifact) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full h-full p-4">
            <PreviewComponent
                artifact={artifact}
                setConsoleLogs={() => {}}
                html=""
                iframeRef={{ current: null }}
            />
        </div>
    );
};

export default SharedArtifactComponent;
