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
			const payload = await res.json();
			const data = Array.isArray(payload)
				? payload
				: Array.isArray(payload?.results)
					? payload.results
					: Array.isArray(payload?.skills)
						? payload.skills
						: Array.isArray(payload?.data)
							? payload.data
							: [];
			for (const item of data) {
				if (
					!item ||
					typeof item !== 'object' ||
					!['slug', 'name', 'description', 'sourceRepo', 'fetchUrl'].every(
						(key) => typeof item[key] === 'string',
					)
				)
					continue;
				const entry: SearchResult = {
					source: 'agentskillhub',
					slug: item.slug,
					name: item.name,
					description: item.description,
					sourceRepo: item.sourceRepo,
					fetchUrl: item.fetchUrl,
				};
				if (typeof item.adoptionCount === 'number') entry.adoptionCount = item.adoptionCount;
				if (typeof item.sourcePath === 'string') entry.sourcePath = item.sourcePath;
				results.push(entry);
			}
		}
	}

	if (sources.includes('github')) {
		const url = `https://api.github.com/search/code?q=filename:SKILL.md+${encodeURIComponent(query)}`;
		const res = await fetch(url);
		if (res.ok) {
			const data = await res.json();
			for (const item of Array.isArray(data?.items) ? data.items : []) {
				if (
					!item ||
					typeof item?.repository?.full_name !== 'string' ||
					typeof item.path !== 'string' ||
					typeof item.name !== 'string'
				)
					continue;
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
