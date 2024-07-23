import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from "@/components/ui";
import { FileIcon } from "@radix-ui/react-icons";
import Image from "next/image";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    fallback?: string;
}

const AttachmentModal = ({ isOpen, onClose, file, fallback }: Props) => {
    const [fileText, setFileText] = useState<string | null>(null);

    useEffect(() => {
        const readFileText = async () => {
            if (file && !file.type.startsWith("image/")) {
                const text = await file.text();
                setFileText(text);
            } else {
                setFileText(null);
            }
        };

        readFileText();
    }, [file]);

    if (!file) return null;

    const isImage = file.type.startsWith("image/");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <DialogTitle className="text-lg font-semibold">
                    Attachment Preview
                </DialogTitle>
                <DialogDescription className="flex items-center">
                    <FileIcon className="w-6 h-6 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{file.name}</span>
                </DialogDescription>
                <div className="mt-4 flex-grow overflow-auto">
                    {isImage ? (
                        <Image
                            src={fallback || URL.createObjectURL(file)}
                            alt={file.name}
                            width={0}
                            height={0}
                            className="max-w-full max-h-[calc(90vh-10rem)] object-contain mx-auto"
                            style={{ width: "auto", height: "auto" }}
                            loader={() => fallback || URL.createObjectURL(file)}
                        />
                    ) : (
                        <div className="flex flex-col h-full w-full">
                            <pre className="bg-gray-100 p-4 rounded w-full h-full overflow-auto text-sm">
                                {fileText || fallback}
                            </pre>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AttachmentModal;
