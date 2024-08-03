import { Converter } from "showdown";
import {
    showdownKatex,
    showdownFootnotes,
    showdownImage,
    showdownCode,
    showdownLink,
    showdownUnclosedCode
} from "@/lib/showdown-extensions";
import DOMPurify from "dompurify";

const markdownToHtml = (markdown: string) => {
    const converter = new Converter({
        tables: true,
        ghCodeBlocks: true,
        strikethrough: true,
        tasklists: true,
        ghMentions: true,
        smoothLivePreview: true,
        smartIndentationFix: true,
        disableForced4SpacesIndentedSublists: true,
        simpleLineBreaks: true,
        requireSpaceBeforeHeadingText: true,
        omitExtraWLInCodeBlocks: true,
        openLinksInNewWindow: true,
        simplifiedAutoLink: true,
        emoji: true,
        extensions: [
            showdownKatex,
            showdownFootnotes,
            showdownImage,
            showdownLink,
            showdownUnclosedCode,
            showdownCode
        ]
    });
    converter.setFlavor("github");
    const html = converter.makeHtml(markdown);
    return DOMPurify.sanitize(html);
};

export default markdownToHtml;
