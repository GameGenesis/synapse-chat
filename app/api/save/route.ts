import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Chat from '@/models/chat';

export async function POST(req: Request) {
    await dbConnect();

    const request = await req.json();
    const { chatId, messages, settings } = request;

    try {
        if (chatId) {
            await Chat.findByIdAndUpdate(chatId, {
                messages,
                settings
            });
            return NextResponse.json({ success: true, chatId });
        } else {
            const chat = new Chat({
                messages,
                settings
            });
            await chat.save();
            console.log(chat._id);
            return NextResponse.json({ success: true, chatId: chat._id });
        }
    } catch (error) {
        console.error("Error updating chat:", error);
        const errorMessage = (error as Error).message;
        return NextResponse.json({ success: false, error: errorMessage });
    }
}
