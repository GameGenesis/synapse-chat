const showdownLink = {
    type: "output",
    filter: function (text: string, converter: any, options: any) {
        const linkRegex = /<a href="([^"]+)"[^>]*>(.*?)<\/a>/g;
        return text.replace(linkRegex, (match, href, content) => {
            return `___CUSTOM_LINK_${encodeURIComponent(
                href
            )}___${encodeURIComponent(content)}___`;
        });
    }
};

export default showdownLink;
