import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ChatProvider } from "@/lib/hooks/use-chat-context";
import ChatHeader from "@/components/chatheader";
import SettingsMenu from "@/components/settings";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("http://localhost:3000/"),
    title: {
        default: "Poe Chatbot",
        template: "%s | Poe Chatbot"
    },
    description: "AI Chatbot with Artifacts"
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ChatProvider>
                    <Toaster position="top-center" />
                    <div className="flex flex-col h-screen w-full overflow-hidden">
                        <ChatHeader />
                        <div className="flex flex-grow overflow-hidden">
                            <div className="flex-grow overflow-y-auto">
                                {children}
                            </div>
                        </div>
                        <SettingsMenu />
                    </div>
                </ChatProvider>
            </body>
        </html>
    );
}
