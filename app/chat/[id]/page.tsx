import { Chat } from "@/components/chat";
import dbConnect from "@/lib/db";
import ChatModel from "@/models/chat";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const params = await props.params;
    const chatId = params.id;

    await dbConnect();
    const chat = await ChatModel.findById(chatId).select("name");

    return {
        title: chat ? chat.name : "Chat"
    };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = "1";
    return <Chat userId={userId} chatId={params.id} />;
}
