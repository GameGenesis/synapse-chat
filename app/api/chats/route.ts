// app/api/chats/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/chat";

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: "User ID is required" 
                }, 
                { status: 400 }
            );
        }

        const chats = await Chat.find(
            { userId },
            {
                _id: 1,
                name: 1,
                updatedAt: 1,
                'messages': { $slice: -1 } // Only get the last message
            }
        )
        .hint({ userId: 1, updatedAt: -1 }) // Use the index
        .sort({ updatedAt: -1 })
        .allowDiskUse(true) // Allow using disk for sorting
        .lean() // Convert documents to plain objects
        .exec();

        return NextResponse.json({
            success: true,
            chats: chats.map(chat => ({
                _id: chat._id,
                name: chat.name,
                updatedAt: chat.updatedAt,
                lastMessage: chat.messages?.[0]?.originalContent || ''
            }))
        });
    } catch (error) {
        console.error("Error in GET /api/chats:", error);
        const errorMessage = error instanceof Error 
            ? error.message 
            : "An unknown error occurred";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
