import React, { useRef, useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { supportedFileFormats } from "@/utils/consts";
import { FileIcon } from "@radix-ui/react-icons";
import { XIcon, ArrowUpIcon } from "./icons";
import toast from "react-hot-toast";
import AttachmentModal from "./modal";
import { PaperclipIcon } from "lucide-react";
import { StopIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

interface Props {
    input: string;
    handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (
        event: React.FormEvent<HTMLFormElement>,
        options?: any
    ) => void;
    isLoading: boolean;
    handleStop: () => void;
}

const ChatFooter = ({
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    handleStop
}: Props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isMultiline, setIsMultiline] = useState(false);
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            const form = event.currentTarget.form;
            if (form) {
                form.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                );
            }
        } else if (event.key === "Enter" && event.shiftKey) {
            // Delay the scroll to after the new line is added
            setTimeout(() => scrollToBottom(), 10);
        }
    };

    const handleTextareaChange = (
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        handleInputChange(event);
        adjustTextareaHeight();
        scrollToBottom();
    };

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const newHeight = Math.min(
                textareaRef.current.scrollHeight,
                5 * 24 + 16
            );
            textareaRef.current.style.height = `${newHeight}px`;
            setIsMultiline(textareaRef.current.value.split("\n").length > 1);
        }
    };

    const scrollToBottom = () => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input, handleInputChange]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const validFiles = newFiles.filter((file) => {
                const fileExtension = `.${file.name
                    .split(".")
                    .pop()
                    ?.toLowerCase()}`;
                if (supportedFileFormats.includes(fileExtension)) {
                    return true;
                } else {
                    toast.error(`Unsupported file: ${file.name}`);
                    return false;
                }
            });

            if (validFiles.length > 0) {
                const dataTransfer = new DataTransfer();
                validFiles.forEach((file) => dataTransfer.items.add(file));
                setFiles(dataTransfer.files);
            } else {
                setFiles(undefined);
            }
        }
    };

    const removeFile = (fileToRemove: File) => {
        if (files) {
            const dataTransfer = new DataTransfer();
            Array.from(files).forEach((file) => {
                if (file !== fileToRemove) {
                    dataTransfer.items.add(file);
                }
            });
            setFiles(
                dataTransfer.files.length > 0 ? dataTransfer.files : undefined
            );
        }
    };

    const renderFilePreview = (file: File) => {
        const isImage = file.type.startsWith("image/");
        const imageSrc = isImage ? URL.createObjectURL(file) : "";
        return (
            <div
                key={file.name}
                className="flex items-center bg-gray-100 rounded-md p-2 mb-2 cursor-pointer"
                onClick={() => {
                    setIsModalOpen(true);
                    setSelectedFile(file);
                }}
            >
                {isImage ? (
                    <Image
                        src={imageSrc}
                        alt={file.name}
                        width={0}
                        height={0}
                        className="w-8 h-8 object-cover mr-2"
                        loader={() => imageSrc}
                    />
                ) : (
                    <div className="w-8 h-8 bg-gray-300 flex items-center justify-center mr-2 rounded">
                        <FileIcon className="w-4 h-4" />
                    </div>
                )}
                <span className="text-sm truncate flex-grow">{file.name}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                    }}
                    className="ml-2 rounded-full"
                >
                    <XIcon className="w-4 h-4" />
                </Button>
            </div>
        );
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files) {
            handleFileUpload({
                target: { files: event.dataTransfer.files }
            } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    return (
        <>
            <AttachmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                file={selectedFile}
            />
            <div className="flex flex-grow-0 w-full bg-background py-2 px-4 border-t align-middle items-center justify-center">
                <form
                    className="relative max-w-[650px] w-full"
                    onSubmit={(event) => {
                        handleSubmit(event, {
                            experimental_attachments: files
                        });
                        setFiles(undefined);
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                    }}
                >
                    {files && files.length > 0 && (
                        <div className="mb-2 max-h-32 overflow-y-auto">
                            {Array.from(files).map(renderFilePreview)}
                        </div>
                    )}
                    <div
                        className={`${
                            isMultiline ? "rounded-2xl" : "rounded-full"
                        } border border-neutral-400 shadow-sm bg-grey-100 w-full flex items-center min-h-[48px] max-h-[136px] overflow-hidden z-10`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <div className="flex-shrink-0 w-12 h-full" />
                        <textarea
                            ref={textareaRef}
                            placeholder="Message Assistant"
                            name="message"
                            id="message"
                            className="resize-none py-3 px-1 m-0 w-full focus:outline-none bg-transparent border-none z-10"
                            value={input}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <div className="flex-shrink-0 w-12 h-full" />
                    </div>
                    <label
                        htmlFor="file-upload"
                        className="absolute w-8 h-8 bottom-2 left-3 rounded-full z-10 bg-black cursor-pointer flex items-center justify-center"
                    >
                        <PaperclipIcon className="w-4 h-4 text-primary-foreground" />
                        <span className="sr-only">Attach File</span>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept={supportedFileFormats.join(", ")}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button
                        type={isLoading ? "button" : "submit"}
                        size="icon"
                        disabled={
                            !isLoading &&
                            input.length === 0 &&
                            (!files || files.length === 0)
                        }
                        className="absolute w-8 h-8 bottom-2 right-3 rounded-full items-center justify-center z-10"
                        onClick={handleStop}
                    >
                        {isLoading ? (
                            <StopIcon className="w-4 h-4 text-primary-foreground" />
                        ) : (
                            <ArrowUpIcon className="w-4 h-4 text-primary-foreground" />
                        )}
                        <span className="sr-only">
                            {isLoading ? "Stop" : "Send"}
                        </span>
                    </Button>
                </form>
            </div>
        </>
    );
};

export default ChatFooter;

// usage
// <ChatFooter input={input} handleInputChange={handleInputChange} handleSubmit={handleSubmit} isLoading={isLoading} addToast={addToast} />
