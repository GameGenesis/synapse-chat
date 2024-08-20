export const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    } else {
        return `${pad(minutes)}:${pad(secs)}`;
    }
}

export const extractTitleFromArticle = (lines: string[]): string => {
    const commonSkipTitles = [
        "skip to content",
        "skip to main content",
        "jump to content",
        "jump to main content",
        "go to content",
        "main menu"
    ];

    // First, try to find a line starting with "Title:" or "## Result:"
    let title = lines.find(
        (line) => line.startsWith("Title:") || line.startsWith("## Result:")
    );
    if (title) {
        title = title.replace(/^(Title:|## Result:)/, "").trim();
        if (!commonSkipTitles.includes(title.toLowerCase())) {
            return title;
        }
    }

    // If not found or it's a common skip title, look for the first non-empty line that's not a common skip title
    title = lines.find((line) => {
        const trimmed = line.trim();
        return trimmed && !commonSkipTitles.includes(trimmed.toLowerCase());
    });

    if (title) {
        return title.trim();
    }

    // If still not found, look for the first heading (line starting with # or ##)
    title = lines.find(
        (line) => line.startsWith("# ") || line.startsWith("## ")
    );
    if (title) {
        return title.replace(/^#+ /, "").trim();
    }

    // If all else fails, return 'Untitled'
    return "Untitled";
};