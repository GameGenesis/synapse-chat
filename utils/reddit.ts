const fetchPostDetails = async (postId: string) => {
    const url = `https://www.reddit.com/comments/${postId}.json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
};

const searchReddit = async (
    query: string,
    subreddit: string = "",
    sort: string = "relevance",
    time: string = "all",
    limit: number = 10
) => {
    const url = `https://www.reddit.com/${
        subreddit ? `r/${subreddit}/` : ""
    }search.json?q=${encodeURIComponent(
        query
    )}&sort=${sort}&t=${time}&limit=${limit}`;

    console.log(url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const searchData = await response.json();
        const detailedResults = await Promise.all(
            searchData.data.children.map(async (child: any) => {
                const postDetails = await fetchPostDetails(child.data.id);
                const post = postDetails[0].data.children[0].data;
                const comments = postDetails[1].data.children
                    .filter((comment: any) => comment.kind === "t1")
                    .map((comment: any) => ({
                        author: comment.data.author,
                        body: comment.data.body,
                        score: comment.data.score
                    }))
                    .slice(0, 5); // Limit to top 5 comments

                console.log(post.title);

                return {
                    title: post.title,
                    subreddit: post.subreddit,
                    url: `https://www.reddit.com${post.permalink}`,
                    score: post.score,
                    num_comments: post.num_comments,
                    author: post.author,
                    selftext: post.selftext,
                    media: post.media
                        ? post.media.reddit_video?.fallback_url || post.url
                        : null,
                    thumbnail:
                        post.thumbnail !== "self" &&
                        post.thumbnail !== "default"
                            ? post.thumbnail
                            : null,
                    created_utc: post.created_utc,
                    top_comments: comments
                };
            })
        );

        return detailedResults;
    } catch (error) {
        console.error("Error searching Reddit:", error);
        return [];
    }
};

export default searchReddit;

/*
// To use this tool:

search_reddit: tool({
        description:
            "Search Reddit for posts, including detailed post information and top comments",
        parameters: z.object({
            query: z.string().describe("The search query"),
            subreddit: z
                .string()
                .optional()
                .describe("Specific subreddit to search in (optional)"),
            sort: z
                .enum(["relevance", "hot", "top", "new", "comments"])
                .default("relevance")
                .describe("Sort order for results"),
            time: z
                .enum(["hour", "day", "week", "month", "year", "all"])
                .default("all")
                .describe("Time range for results"),
            limit: z
                .number()
                .min(1)
                .max(25)
                .default(5)
                .describe("Number of results to return (default 5)")
        }),
        execute: async ({ query, subreddit, sort, time, limit }) => {
            const results = await searchReddit(
                query,
                subreddit || "",
                sort,
                time,
                limit
            );
            return { results };
        }
    }),


*/
