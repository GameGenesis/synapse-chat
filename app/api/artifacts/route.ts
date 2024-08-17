import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Artifact from "@/models/artifact";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const artifactData = await req.json();
        const artifact = new Artifact({
            ...artifactData,
            userId: "1"
        });
        await artifact.save();

        return NextResponse.json({ id: artifact._id }, { status: 201 });
    } catch (error) {
        console.error("Error saving artifact:", error);
        return NextResponse.json(
            { error: "Failed to save artifact" },
            { status: 500 }
        );
    }
}
