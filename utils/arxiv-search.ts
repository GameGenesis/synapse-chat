import { parseString } from "xml2js";
import { promisify } from "util";

const parseXml = promisify(parseString);

const BASE_URL = "http://export.arxiv.org/api/query";

export interface ArxivResult {
    id: string;
    title: string;
    summary: string;
    authors: string[];
    published: string;
}

export async function searchArxiv(
    query: string,
    maxResults: number = 5
): Promise<ArxivResult[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `${BASE_URL}?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

    const response = await fetch(url);
    const text = await response.text();

    try {
        const result = (await parseXml(text)) as any;
        const entries = result.feed.entry || [];

        return entries.map((entry: any) => ({
            id: entry.id[0],
            title: entry.title[0],
            summary: entry.summary[0],
            authors: entry.author.map((author: any) => author.name[0]),
            published: entry.published[0]
        }));
    } catch (error) {
        console.error("Error parsing arXiv response:", error);
        return [];
    }
}
