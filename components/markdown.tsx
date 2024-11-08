import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";

const AttachmentModal = dynamic(() => import("./attachmentmodal"), {
    ssr: false
});

interface Props {
    html: string;
    className?: string;
}

export const CustomMarkdown = ({ html, className = "" }: Props) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const openImageModal = useCallback((src: string) => {
        // Extract the original image URL from the Next.js Image component srcset
        const match = src.match(/url=([^&]+)/);
        if (match && match[1]) {
            const decodedUrl = decodeURIComponent(match[1]);
            const originalUrlMatch = decodedUrl.match(/url=([^&]+)/);
            if (originalUrlMatch && originalUrlMatch[1]) {
                setSelectedImage(decodeURIComponent(originalUrlMatch[1]));
            } else {
                setSelectedImage(decodedUrl);
            }
        } else {
            setSelectedImage(src);
        }
    }, []);

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleImageClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "IMG") {
                event.preventDefault();
                event.stopPropagation();
                const srcset = target.getAttribute("srcset");
                if (srcset) {
                    // Use the highest resolution image from srcset
                    const srcsetParts = srcset.split(",");
                    const lastSrc = srcsetParts[srcsetParts.length - 1]
                        .trim()
                        .split(" ")[0];
                    openImageModal(lastSrc);
                } else {
                    const src = target.getAttribute("src");
                    if (src) {
                        openImageModal(src);
                    }
                }
            }
        };

        container.addEventListener("click", handleImageClick);

        return () => {
            container.removeEventListener("click", handleImageClick);
        };
    }, [openImageModal]);

    useEffect(() => {
        const handleCopyClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const button = target.closest(
                ".copy-code-button"
            ) as HTMLButtonElement;
            if (button) {
                const codeBlock = button
                    .closest(".code-block")
                    ?.querySelector("code");
                if (codeBlock) {
                    const code = codeBlock.innerText;
                    navigator.clipboard
                        .writeText(code)
                        .then(() => {
                            const icon = button.querySelector(".copy-icon");
                            if (icon) icon.classList.add("hidden");

                            const text = button.querySelector(".button-text");
                            if (text) {
                                text.textContent = "Copied!";
                                text.classList.remove("hidden");
                            }

                            setTimeout(() => {
                                if (icon) icon.classList.remove("hidden");
                                if (text) {
                                    text.textContent = "Copy code";
                                    text.classList.add("hidden");
                                }
                            }, 2000);
                        })
                        .catch((err) => {
                            console.error("Failed to copy text: ", err);
                        });
                }
            }
        };

        const handleDownloadClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const button = target.closest(
                ".download-code-button"
            ) as HTMLButtonElement;
            if (button) {
                e.stopPropagation();
                e.preventDefault();

                const codeBlock = button.closest(".code-block");
                if (codeBlock) {
                    const code = codeBlock.querySelector("code")?.innerText;
                    const extension = codeBlock.getAttribute("data-extension");

                    if (code && extension) {
                        button.setAttribute("disabled", "true");

                        const blob = new Blob([code], { type: "text/plain" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `code.${extension}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);

                        const icon = button.querySelector(".download-icon");
                        if (icon) icon.classList.add("hidden");

                        const text = button.querySelector(".button-text");
                        if (text) {
                            text.textContent = "Downloaded!";
                            text.classList.remove("hidden");
                        }

                        setTimeout(() => {
                            if (icon) icon.classList.remove("hidden");
                            if (text) {
                                text.textContent = "Download";
                                text.classList.add("hidden");
                            }
                            button.removeAttribute("disabled");
                        }, 2000);
                    }
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("click", handleCopyClick);
            container.addEventListener("click", handleDownloadClick);

            return () => {
                container.removeEventListener("click", handleCopyClick);
                container.removeEventListener("click", handleDownloadClick);
            };
        }
    }, []);

    return (
        <>
            <div
                ref={containerRef}
                className={`markdown-body prose max-w-full m-0 p-0 ${className}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
            <AttachmentModal
                isOpen={!!selectedImage}
                onClose={closeImageModal}
                file={null}
                fallback={selectedImage || ""}
                image
            />
        </>
    );
};
