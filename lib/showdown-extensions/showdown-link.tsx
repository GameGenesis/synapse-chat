import { CustomLink } from "@/components/link";
import { renderToString } from "react-dom/server";

const showdownLink = {
    type: "output",
    filter: function (text: string) {
        const linkRegex =
            /<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:\s+[^>]*?)?>([^<]*)<\/a>/g;
        return text.replace(linkRegex, (match, href, content) => {
            return renderToString(
                <CustomLink href={href}>{content}</CustomLink>
            );
        });
    }
};

export default showdownLink;
