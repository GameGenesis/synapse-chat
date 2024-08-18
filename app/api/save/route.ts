import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/chat";
import User from "@/models/user";

export async function POST(req: Request) {
    try {
        await dbConnect();

        const body = await req.json();
        if (!body) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Request body is empty"
                },
                { status: 400 }
            );
        }

        const { userId, chatId, chatName, messages, settings } = body;

        if (
            !userId ||
            !chatId ||
            !Array.isArray(messages) ||
            typeof settings !== "object"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid request format"
                },
                { status: 400 }
            );
        }

        // Update or create user
        const userUpdate = {
            $set: { settings },
            $addToSet: { chats: chatId }
        };

        const userOptions = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        };

        const user = await User.findOneAndUpdate(
            { _id: userId },
            userUpdate,
            userOptions
        );

        if (!user) {
            throw new Error("Failed to upsert user");
        }

        // Update or create chat
        const chatUpdate = {
            userId,
            messages,
            name: chatName
        };

        const chatOptions = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        };

        const chat = await Chat.findOneAndUpdate(
            { _id: chatId },
            chatUpdate,
            chatOptions
        );

        if (!chat) {
            throw new Error("Failed to upsert chat");
        }

        // Determine if this was a new chat or an update
        const isNewChat = chat.createdAt.getTime() === chat.updatedAt.getTime();

        return NextResponse.json(
            {
                success: true,
                userId: user._id,
                chatId: chat._id,
                chatName,
                isNewChat
            },
            { status: isNewChat ? 201 : 200 }
        );
    } catch (error) {
        console.error("Error in POST /api/save:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unknown error occurred";
        return NextResponse.json(
            {
                success: false,
                error: errorMessage
            },
            { status: 500 }
        );
    }
}
