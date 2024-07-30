// Credit: https://github.com/halbgut/showdown-footnotes
import { Converter } from "showdown";
const converter = new Converter();

const showdownFootnotes = () => {
    return [
        {
            type: "lang",
            filter: function filter(text: string) {
                return text.replace(
                    /^\[\^([\d\w]+)\]:\s*((\n+(\s{2,4}|\t).+)+)$/gm,
                    function (str, name, rawContent, _, padding) {
                        var content = converter.makeHtml(
                            rawContent.replace(
                                new RegExp("^" + padding, "gm"),
                                ""
                            )
                        );
                        return (
                            '<div class="footnote" id="footnote-' +
                            name +
                            '"><a href="#footnote-' +
                            name +
                            '"><sup>[' +
                            name +
                            "]</sup></a>:" +
                            content +
                            "</div>"
                        );
                    }
                );
            }
        },
        {
            type: "lang",
            filter: function filter(text: string) {
                return text.replace(
                    /^\[\^([\d\w]+)\]:( |\n)((.+\n)*.+)$/gm,
                    function (str, name, _, content) {
                        return (
                            '<small class="footnote" id="footnote-' +
                            name +
                            '"><a href="#footnote-' +
                            name +
                            '"><sup>[' +
                            name +
                            "]</sup></a>: " +
                            content +
                            "</small>"
                        );
                    }
                );
            }
        },
        {
            type: "lang",
            filter: function filter(text: string) {
                return text.replace(/\[\^([\d\w]+)\]/m, function (str, name) {
                    return (
                        '<a href="#footnote-' +
                        name +
                        '"><sup>[' +
                        name +
                        "]</sup></a>"
                    );
                });
            }
        }
    ];
};

export default showdownFootnotes;
