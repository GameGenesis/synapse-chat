// app/api/github/context/route.ts
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

if (!process.env.GITHUB_ACCESS_TOKEN) {
    throw new Error('GITHUB_TOKEN is not defined in environment variables');
}

const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN
});

// Define types for better structure
interface FileStructure {
    name: string;
    path: string;
    type: string;
    content?: string;
    children?: FileStructure[];
}

async function fetchFileContent(owner: string, repo: string, path: string) {
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
        });

        if ('content' in data && data.encoding === 'base64') {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return null;
    } catch (error) {
        console.error(`Error fetching content for ${path}:`, error);
        return null;
    }
}

// File extensions to ignore (binary files, large files, etc.)
const IGNORED_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', 
    '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mp3', 
    '.wav', '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar'
]);

// Directories to ignore
const IGNORED_DIRECTORIES = new Set([
    'node_modules', '.git', '.next', 'build', 'dist', 
    'coverage', '.cache', '.idea', '.vscode'
]);

function shouldProcessFile(path: string): boolean {
    const extension = path.slice(path.lastIndexOf('.'));
    const directory = path.split('/')[0];

    return !IGNORED_EXTENSIONS.has(extension) && 
           !IGNORED_DIRECTORIES.has(directory);
}

async function getRepositoryStructure(
    owner: string, 
    repo: string, 
    path: string = ''
): Promise<FileStructure[]> {
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
        });

        const contents = Array.isArray(data) ? data : [data];
        const structure: FileStructure[] = [];

        for (const item of contents) {
            if (!shouldProcessFile(item.path)) {
                continue;
            }

            if (item.type === 'dir') {
                const children = await getRepositoryStructure(owner, repo, item.path);
                structure.push({
                    name: item.name,
                    path: item.path,
                    type: item.type,
                    children
                });
            } else {
                const content = await fetchFileContent(owner, repo, item.path);
                structure.push({
                    name: item.name,
                    path: item.path,
                    type: item.type,
                    content: content ?? ""
                });
            }
        }

        return structure;
    } catch (error) {
        console.error(`Error fetching structure for ${path}:`, error);
        return [];
    }
}

function formatRepositoryContent(structure: FileStructure[], level: number = 0): string {
    let output = '';
    const indent = '  '.repeat(level);

    for (const item of structure) {
        if (item.type === 'dir') {
            output += `${indent}📁 ${item.path}/\n`;
            if (item.children) {
                output += formatRepositoryContent(item.children, level + 1);
            }
        } else {
            output += `${indent}📄 ${item.path}\n`;
            if (item.content) {
                output += `\n--- BEGIN ${item.path} ---\n`;
                output += `\`\`\`${item.type}\n`;
                output += item.content;
                output += `\n\`\`\``;
                output += `\n--- END ${item.path} ---\n\n`;
            }
        }
    }

    return output;
}

export async function POST(req: Request) {
    try {
        const { repoUrl } = await req.json();

        // Validate URL format
        if (!repoUrl) {
            return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
        }

        // Parse GitHub URL
        let owner, repo;
        try {
            const urlParts = new URL(repoUrl).pathname.split('/').filter(Boolean);
            [owner, repo] = urlParts;
        } catch (error) {
            return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
        }

        if (!owner || !repo) {
            return NextResponse.json({ error: 'Invalid repository URL format' }, { status: 400 });
        }

        // Get complete repository structure with contents
        const structure = await getRepositoryStructure(owner, repo);

        // Format the content for the LLM
        const formattedContent = formatRepositoryContent(structure);

        // Get repository information
        const { data: repoInfo } = await octokit.repos.get({
            owner,
            repo,
        });

        return NextResponse.json({
            repoInfo: {
                name: repoInfo.name,
                description: repoInfo.description,
                defaultBranch: repoInfo.default_branch,
                stars: repoInfo.stargazers_count,
                forks: repoInfo.forks_count,
                language: repoInfo.language,
            },
            structure,
            formattedContent,
        });

    } catch (error) {
        console.error('GitHub API Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch repository data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}