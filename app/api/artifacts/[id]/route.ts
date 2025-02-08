import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Artifact from "@/models/artifact";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        await dbConnect();
        const artifact = await Artifact.findById(params.id).lean();
        if (!artifact) {
            return NextResponse.json(
                { error: "Artifact not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(artifact);
    } catch (error) {
        console.error("Error fetching artifact:", error);
        return NextResponse.json(
            { error: "Failed to fetch artifact" },
            { status: 500 }
        );
    }
}
