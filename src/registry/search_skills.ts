import type { RegistrySource, SearchResult, SearchSkillsOptions } from './types.ts';

export async function searchSkills(
	query: string,
	options?: SearchSkillsOptions,
): Promise<SearchResult[]> {
	if (!query.trim()) return [];

	const sources: ReadonlyArray<RegistrySource> = options?.sources ?? ['agentskillhub', 'github'];
	const limit = options?.limit ?? 10;
	const results: SearchResult[] = [];

	if (sources.includes('agentskillhub')) {
		const url = `https://agentskillhub.dev/api/v1/search?q=${encodeURIComponent(query)}&limit=${String(limit)}`;
		const res = await fetch(url);
		if (res.ok) {
			const data = (await res.json()) as Array<{
				slug: string;
				name: string;
				description: string;
				adoptionCount?: number;
				sourceRepo: string;
				sourcePath?: string;
				fetchUrl: string;
			}>;
			for (const item of data) {
				const entry: SearchResult = {
					source: 'agentskillhub',
					slug: item.slug,
					name: item.name,
					description: item.description,
					sourceRepo: item.sourceRepo,
					fetchUrl: item.fetchUrl,
				};
				if (item.adoptionCount !== undefined) entry.adoptionCount = item.adoptionCount;
				if (item.sourcePath !== undefined) entry.sourcePath = item.sourcePath;
				results.push(entry);
			}
		}
	}

	if (sources.includes('github')) {
		const url = `https://api.github.com/search/code?q=filename:SKILL.md+${encodeURIComponent(query)}`;
		const res = await fetch(url);
		if (res.ok) {
			const data = (await res.json()) as {
				items: Array<{
					repository: { full_name: string };
					path: string;
					name: string;
				}>;
			};
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
		}
	}

	const seen = new Set<string>();
	const unique: SearchResult[] = [];
	for (const r of results) {
		if (!seen.has(r.slug)) {
			seen.add(r.slug);
			unique.push(r);
		}
	}

	return unique.slice(0, limit);
}
