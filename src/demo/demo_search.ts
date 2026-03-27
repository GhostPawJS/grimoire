import type { SearchResult } from '../registry/types.ts';

export type GitHubRateLimit = {
	remaining: number;
	resetAt: Date | null;
};

let lastRateLimit: GitHubRateLimit = { remaining: 60, resetAt: null };
let usedFallback = false;

export function getGitHubRateLimit(): GitHubRateLimit {
	return lastRateLimit;
}

export function didUseFallback(): boolean {
	return usedFallback;
}

const GITHUB_FALLBACK_RESULTS: SearchResult[] = [
	{
		source: 'github',
		slug: 'ghostpawjs/grimoire/skills/inscribe-spells-correctly/SKILL.md',
		name: 'inscribe-spells-correctly',
		description: 'Validate and write SKILL.md files with correct frontmatter and body structure',
		sourceRepo: 'ghostpawjs/grimoire',
		sourcePath: 'skills/inscribe-spells-correctly/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/ghostpawjs/grimoire/main/skills/inscribe-spells-correctly/SKILL.md',
	},
	{
		source: 'github',
		slug: 'modelcontextprotocol/servers/src/fetch/SKILL.md',
		name: 'mcp-fetch-server',
		description: 'MCP server for HTTP fetch with URL validation, caching, and markdown conversion',
		sourceRepo: 'modelcontextprotocol/servers',
		sourcePath: 'src/fetch/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/fetch/SKILL.md',
	},
	{
		source: 'github',
		slug: 'anthropics/anthropic-cookbook/skills/prompt-caching/SKILL.md',
		name: 'prompt-caching-patterns',
		description: 'Cache long system prompts with Anthropic API to reduce latency and cost',
		sourceRepo: 'anthropics/anthropic-cookbook',
		sourcePath: 'skills/prompt-caching/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/skills/prompt-caching/SKILL.md',
	},
	{
		source: 'github',
		slug: 'vercel/next.js/examples/with-docker/SKILL.md',
		name: 'nextjs-docker-deploy',
		description: 'Containerize Next.js apps with multi-stage Docker builds and standalone output',
		sourceRepo: 'vercel/next.js',
		sourcePath: 'examples/with-docker/SKILL.md',
		fetchUrl: 'https://raw.githubusercontent.com/vercel/next.js/main/examples/with-docker/SKILL.md',
	},
	{
		source: 'github',
		slug: 'supabase/supabase/skills/row-level-security/SKILL.md',
		name: 'supabase-rls-policies',
		description: 'PostgreSQL row-level security policies for multi-tenant Supabase projects',
		sourceRepo: 'supabase/supabase',
		sourcePath: 'skills/row-level-security/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/supabase/supabase/main/skills/row-level-security/SKILL.md',
	},
	{
		source: 'github',
		slug: 'langchain-ai/langchain/skills/rag-retrieval/SKILL.md',
		name: 'langchain-rag-retrieval',
		description:
			'Build RAG pipelines with LangChain document loaders, splitters, and vector stores',
		sourceRepo: 'langchain-ai/langchain',
		sourcePath: 'skills/rag-retrieval/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/langchain-ai/langchain/main/skills/rag-retrieval/SKILL.md',
	},
	{
		source: 'github',
		slug: 'microsoft/playwright/skills/test-fixtures/SKILL.md',
		name: 'playwright-test-fixtures',
		description: 'Playwright fixture patterns for page objects, auth state, and parallel sharding',
		sourceRepo: 'microsoft/playwright',
		sourcePath: 'skills/test-fixtures/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/microsoft/playwright/main/skills/test-fixtures/SKILL.md',
	},
	{
		source: 'github',
		slug: 'hashicorp/terraform/skills/module-composition/SKILL.md',
		name: 'terraform-module-composition',
		description: 'Compose Terraform modules with inputs, outputs, and remote state references',
		sourceRepo: 'hashicorp/terraform',
		sourcePath: 'skills/module-composition/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/hashicorp/terraform/main/skills/module-composition/SKILL.md',
	},
	{
		source: 'github',
		slug: 'docker/docs/skills/multi-stage-builds/SKILL.md',
		name: 'docker-multi-stage-guide',
		description:
			'Docker multi-stage build patterns for minimal production images with layer caching',
		sourceRepo: 'docker/docs',
		sourcePath: 'skills/multi-stage-builds/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/docker/docs/main/skills/multi-stage-builds/SKILL.md',
	},
	{
		source: 'github',
		slug: 'prisma/prisma/skills/schema-migrations/SKILL.md',
		name: 'prisma-schema-migrations',
		description: 'Prisma schema migrations with expand-contract patterns and rollback safety',
		sourceRepo: 'prisma/prisma',
		sourcePath: 'skills/schema-migrations/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/prisma/prisma/main/skills/schema-migrations/SKILL.md',
	},
	{
		source: 'github',
		slug: 'owasp/cheatsheets/skills/jwt-hardening/SKILL.md',
		name: 'owasp-jwt-hardening',
		description: 'OWASP JWT security checklist with signing, claims validation, and rotation',
		sourceRepo: 'owasp/cheatsheets',
		sourcePath: 'skills/jwt-hardening/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/owasp/cheatsheets/main/skills/jwt-hardening/SKILL.md',
	},
	{
		source: 'github',
		slug: 'grafana/k6/skills/load-test-thresholds/SKILL.md',
		name: 'k6-load-test-thresholds',
		description: 'k6 load test scenarios with ramping VUs, percentile thresholds, and CI gates',
		sourceRepo: 'grafana/k6',
		sourcePath: 'skills/load-test-thresholds/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/grafana/k6/main/skills/load-test-thresholds/SKILL.md',
	},
	{
		source: 'github',
		slug: 'biomejs/biome/skills/lint-format-config/SKILL.md',
		name: 'biome-lint-format',
		description: 'Configure Biome linter and formatter with project-wide rules and IDE integration',
		sourceRepo: 'biomejs/biome',
		sourcePath: 'skills/lint-format-config/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/biomejs/biome/main/skills/lint-format-config/SKILL.md',
	},
	{
		source: 'github',
		slug: 'redis/redis/skills/pub-sub-streams/SKILL.md',
		name: 'redis-pub-sub-streams',
		description: 'Redis Pub/Sub and Streams for real-time event processing and consumer groups',
		sourceRepo: 'redis/redis',
		sourcePath: 'skills/pub-sub-streams/SKILL.md',
		fetchUrl: 'https://raw.githubusercontent.com/redis/redis/main/skills/pub-sub-streams/SKILL.md',
	},
	{
		source: 'github',
		slug: 'github/actions/skills/reusable-workflows/SKILL.md',
		name: 'github-actions-reusable',
		description: 'GitHub Actions reusable workflows with matrix builds, caching, and OIDC auth',
		sourceRepo: 'github/actions',
		sourcePath: 'skills/reusable-workflows/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/github/actions/main/skills/reusable-workflows/SKILL.md',
	},
	{
		source: 'github',
		slug: 'tailwindlabs/tailwindcss/skills/design-tokens/SKILL.md',
		name: 'tailwind-design-tokens',
		description: 'Tailwind CSS design token workflow with custom theme config and dark mode',
		sourceRepo: 'tailwindlabs/tailwindcss',
		sourcePath: 'skills/design-tokens/SKILL.md',
		fetchUrl:
			'https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/skills/design-tokens/SKILL.md',
	},
];

/**
 * GitHub Code Search with graceful fallback.
 * Unauthenticated requests often return 401/403 from browser origins.
 * When that happens, return curated fallback results filtered by query.
 */
export async function searchGitHubLive(query: string): Promise<SearchResult[]> {
	const q = `filename:SKILL.md+${encodeURIComponent(query)}`;
	const url = `https://api.github.com/search/code?q=${q}&per_page=20`;
	try {
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
		if (res.status === 401 || res.status === 403) {
			usedFallback = true;
			return filterFallback(query);
		}
		if (!res.ok) {
			usedFallback = true;
			return filterFallback(query);
		}
		usedFallback = false;
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
	} catch {
		usedFallback = true;
		return filterFallback(query);
	}
}

function filterFallback(query: string): SearchResult[] {
	const lower = query.toLowerCase();
	const terms = lower.split(/\s+/).filter(Boolean);
	if (terms.length === 0) return GITHUB_FALLBACK_RESULTS;
	return GITHUB_FALLBACK_RESULTS.filter((r) => {
		const hay = `${r.name} ${r.description} ${r.sourceRepo}`.toLowerCase();
		return terms.some((t) => hay.includes(t));
	});
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
