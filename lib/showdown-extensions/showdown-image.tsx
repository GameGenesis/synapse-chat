import { renderToString } from "react-dom/server";
import Image from "next/image";

const showdownImage: showdown.ShowdownExtension = {
    type: "output",
    filter: (text: string) => {
        const imgRegex =
            /<img[^>]+src="([^"]+)"(?:\s+alt="([^"]*)")?\s*[^>]*>/g;
        return text.replace(imgRegex, (match, src, alt) => {
            // Convert protocol-relative URLs to absolute URLs
            const absoluteSrc = src.startsWith("//") ? `https:${src}` : src;

            return renderToString(
                <Image
                    src={absoluteSrc}
                    alt={alt || "Image"}
                    onClick={() => {
                        // This will be replaced with actual functionality in the component
                        console.log("OPEN_IMAGE_MODAL:" + src);
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    width={0}
                    height={0}
                    layout="responsive"
                />
            );
        });
    }
};

export default showdownImage;
