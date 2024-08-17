import { Suspense } from "react";
import SharedArtifactComponent from "@/components/sharedartifactcomponent";

export default function SharedArtifactPage({
    params
}: {
    params: { id: string };
}) {
    return (
        <div className="w-full h-full">
            <Suspense fallback={<div>Loading...</div>}>
                <SharedArtifactComponent id={params.id} />
            </Suspense>
        </div>
    );
}
