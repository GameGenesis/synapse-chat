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
            if (target && target.classList.contains("copy-code-button")) {
                const codeBlock = target
                    .closest(".code-block")
                    ?.querySelector("code");
                if (codeBlock) {
                    const code = codeBlock.innerText;
                    navigator.clipboard
                        .writeText(code)
                        .then(() => {
                            target.textContent = "Copied!";
                            setTimeout(() => {
                                target.textContent = "Copy code";
                            }, 2000);
                        })
                        .catch((err) => {
                            console.error("Failed to copy text: ", err);
                        });
                }
            }
        };

        document.addEventListener("click", handleCopyClick);

        return () => {
            document.removeEventListener("click", handleCopyClick);
        };
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
