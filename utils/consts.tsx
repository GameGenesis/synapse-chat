export const assistant_name = "Poe";
export const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
});
export const supportedFileFormats = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".txt",
    ".html",
    ".xml",
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".c",
    ".csv"
];
// export const supportedFileFormats = ["image/*", "text/*"];
export const maxToolRoundtrips = 3;
