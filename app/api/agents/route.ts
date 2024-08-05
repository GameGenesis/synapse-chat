import { createAndUseAgentNetwork } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    
    const result = await createAndUseAgentNetwork(prompt);
    
    // Ensure result is an array
    const messages = Array.isArray(result) ? result : [result];
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error in POST /api/agents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}