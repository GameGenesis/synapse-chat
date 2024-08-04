import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/chat";

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        if (!body) {
            return NextResponse.json({
                success: false,
                error: "Request body is empty"
            }, { status: 400 });
        }

        const { chatId, messages, settings } = body;

        if (!chatId || !Array.isArray(messages) || typeof settings !== 'object') {
            return NextResponse.json({
                success: false,
                error: "Invalid request format"
            }, { status: 400 });
        }

        const update = {
            messages,
            settings
        };

        const options = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        };

        const chat = await Chat.findOneAndUpdate({ _id: chatId }, update, options);

        if (!chat) {
            throw new Error("Failed to upsert chat");
        }

        // Determine if this was a new chat or an update
        const isNewChat = chat.createdAt.getTime() === chat.updatedAt.getTime();

        return NextResponse.json({ 
            success: true, 
            chatId: chat._id,
            isNewChat
        }, { status: isNewChat ? 201 : 200 });

    } catch (error) {
        console.error("Error in POST /api/chat:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ 
            success: false, 
            error: errorMessage 
        }, { status: 500 });
    }
}