import { Chat } from "@/components/chat";
import dbConnect from "@/lib/db";
import ChatModel from "@/models/chat";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const chatId = params.id;

    await dbConnect();
    const chat = await ChatModel.findById(chatId).select("name");

    return {
        title: chat ? chat.name : "Chat"
    };
}

export default function Page({ params }: { params: { id: string } }) {
    return <Chat userId="1" chatId={params.id} />;
}
