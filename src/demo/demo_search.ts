import type { SearchResult } from '../registry/types.ts';

export type GitHubRateLimit = {
	remaining: number;
	resetAt: Date | null;
};

let lastRateLimit: GitHubRateLimit = { remaining: 60, resetAt: null };

export function getGitHubRateLimit(): GitHubRateLimit {
	return lastRateLimit;
}

/**
 * GitHub Code Search (CORS-friendly). Unauthenticated: ~10 req/min.
 */
export async function searchGitHubLive(query: string): Promise<SearchResult[]> {
	const q = `filename:SKILL.md+${encodeURIComponent(query)}`;
	const url = `https://api.github.com/search/code?q=${q}&per_page=20`;
	const res = await fetch(url, {
		headers: { Accept: 'application/vnd.github+json' },
	});
	const remaining = res.headers.get('x-ratelimit-remaining');
	const reset = res.headers.get('x-ratelimit-reset');
	if (remaining !== null) {
		lastRateLimit = {
			remaining: Number(remaining),
			resetAt: reset !== null ? new Date(Number(reset) * 1000) : null,
		};
	}
	if (!res.ok) {
		throw new Error(`GitHub search failed: ${String(res.status)} ${res.statusText}`);
	}
	const data = (await res.json()) as {
		items: Array<{
			repository: { full_name: string };
			path: string;
			name: string;
		}>;
	};
	const results: SearchResult[] = [];
	for (const item of data.items) {
		const slug = `${item.repository.full_name}/${item.path}`;
		results.push({
			source: 'github',
			slug,
			name: item.name,
			description: `SKILL.md in ${item.repository.full_name}`,
			sourceRepo: item.repository.full_name,
			sourcePath: item.path,
			fetchUrl: `https://raw.githubusercontent.com/${item.repository.full_name}/HEAD/${item.path}`,
		});
	}
	return results;
}

type GhContent = {
	content?: string;
	encoding?: string;
};

/**
 * Fetch raw SKILL.md from GitHub Contents API (base64).
 */
export async function adoptFromGitHub(sourceRepo: string, sourcePath: string): Promise<string> {
	const [owner, repo] = sourceRepo.split('/');
	if (!owner || !repo) {
		throw new Error(`Invalid repo: ${sourceRepo}`);
	}
	const fixedUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${sourcePath.split('/').map(encodeURIComponent).join('/')}`;
	const res = await fetch(fixedUrl, {
		headers: { Accept: 'application/vnd.github+json' },
	});
	const remaining = res.headers.get('x-ratelimit-remaining');
	const reset = res.headers.get('x-ratelimit-reset');
	if (remaining !== null) {
		lastRateLimit = {
			remaining: Number(remaining),
			resetAt: reset !== null ? new Date(Number(reset) * 1000) : null,
		};
	}
	if (!res.ok) {
		throw new Error(`GitHub contents failed: ${String(res.status)} ${res.statusText}`);
	}
	const json = (await res.json()) as GhContent;
	if (json.encoding !== 'base64' || !json.content) {
		throw new Error('Unexpected GitHub API response for file contents');
	}
	const raw = atob(json.content.replace(/\n/g, ''));
	return raw;
}
