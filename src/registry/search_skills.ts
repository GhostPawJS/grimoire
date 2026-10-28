import type { RegistrySource, SearchResult, SearchSkillsOptions } from './types.ts';

export async function searchSkills(
	query: string,
	options?: SearchSkillsOptions,
): Promise<SearchResult[]> {
	if (!query.trim()) return [];

	const sources: ReadonlyArray<RegistrySource> = options?.sources ?? ['agentskillhub', 'github'];
	const limit = options?.limit ?? 10;
	const results: SearchResult[] = [];
	const pending: SearchResult[] = [];

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
				if (item && typeof item === 'object') {
					item.sourceRepo ??=
						item.sourceIdentifier ??
						item.source_repo ??
						item.repo_url ??
						item.repository_url ??
						item.github_url ??
						item.repo ??
						item.repository?.full_name ??
						item.repository;
					item.sourcePath ??=
						item.source_path ?? item.file_path ?? item.skillPath ?? item.path ?? item.skill_path;
					if (typeof item.sourceRepo === 'string')
						item.sourceRepo = item.sourceRepo
							.replace(/^https:\/\/github.com\//, '')
							.replace(/\.git$/, '');
					item.fetchUrl ??=
						item.fetch_url ??
						(typeof item.sourceRepo === 'string' && typeof item.sourcePath === 'string'
							? treeUrl(
									item.sourceRepo,
									item.sourcePath.replace(/\/$/, '').replace(/\/?SKILL\.md$/, ''),
									typeof item.ref === 'string' ? item.ref : 'HEAD',
								)
							: undefined);
				}
				if (
					!item ||
					typeof item !== 'object' ||
					!['slug', 'name', 'description', 'sourceRepo'].every(
						(key) => typeof item[key] === 'string',
					) ||
					!REPO_PATTERN.test(item.sourceRepo)
				)
					continue;
				const entry: SearchResult = {
					source: 'agentskillhub',
					slug: item.slug,
					name: item.name,
					description: item.description,
					sourceRepo: item.sourceRepo,
					fetchUrl:
						typeof item.fetchUrl === 'string' ? item.fetchUrl : treeUrl(item.sourceRepo, ''),
				};
				if (typeof item.fetchUrl !== 'string') pending.push(entry);
				if (typeof item.totalInstalls === 'number') entry.adoptionCount = item.totalInstalls;
				if (typeof item.adoptionCount === 'number') entry.adoptionCount = item.adoptionCount;
				if (typeof item.sourcePath === 'string') entry.sourcePath = item.sourcePath;
				results.push(entry);
			}
		}
	}

	if (sources.includes('github')) {
		const url = `https://api.github.com/search/code?q=filename:SKILL.md+${encodeURIComponent(query)}`;
		const token = process.env.GITHUB_TOKEN;
		const res = await fetch(
			url,
			token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
		);
		if (res.status === 401 || res.status === 403)
			options?.onWarning?.({ code: 'auth_required', message: 'Set GITHUB_TOKEN to search GitHub' });
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
					fetchUrl: treeUrl(item.repository.full_name, item.path.replace(/\/?SKILL\.md$/, '')),
				});
			}
		}
	}

	await resolveRegistryPaths(pending, options);

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

const REPO_PATTERN = /^(?!\.\.?\/)[A-Za-z0-9_.-]+\/(?!\.\.?$)[A-Za-z0-9_.-]+$/;

function treeUrl(repo: string, dir: string, ref = 'HEAD'): string {
	return dir
		? `https://github.com/${repo}/tree/${encodeURIComponent(ref)}/${dir.split('/').map(encodeURIComponent).join('/')}`
		: `https://github.com/${repo}`;
}

/**
 * Registry entries name a repository but not the skill folder. Look the folder up in the
 * repository tree (one request per repository) so the adopt source imports only that skill.
 */
async function resolveRegistryPaths(
	entries: SearchResult[],
	options?: SearchSkillsOptions,
): Promise<void> {
	const byRepo = new Map<string, SearchResult[]>();
	for (const entry of entries) {
		const list = byRepo.get(entry.sourceRepo) ?? [];
		list.push(entry);
		byRepo.set(entry.sourceRepo, list);
	}
	const unresolved: string[] = [];
	const token = process.env.GITHUB_TOKEN;
	for (const [repo, list] of [...byRepo].slice(0, 5)) {
		let files: string[] = [];
		try {
			const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`, {
				headers: {
					Accept: 'application/vnd.github+json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
			});
			if (res.ok) {
				const tree = (await res.json()) as { tree?: Array<{ path?: unknown; type?: unknown }> };
				files = (tree.tree ?? [])
					.filter((node) => node.type === 'blob' && typeof node.path === 'string')
					.map((node) => node.path as string)
					.filter((path) => path === 'SKILL.md' || path.endsWith('/SKILL.md'));
			}
		} catch {
			files = [];
		}
		for (const entry of list) {
			const dirs = files
				.map((path) => path.replace(/\/?SKILL\.md$/, ''))
				.filter((dir) => dir.split('/').pop() === entry.slug);
			const dir = dirs.sort((a, b) => a.length - b.length)[0];
			if (dir) {
				entry.sourcePath = `${dir}/SKILL.md`;
				entry.fetchUrl = treeUrl(repo, dir);
			} else unresolved.push(`${entry.slug} (${repo})`);
		}
	}
	for (const [repo, list] of [...byRepo].slice(5))
		for (const entry of list) unresolved.push(`${entry.slug} (${repo})`);
	if (unresolved.length > 0)
		options?.onWarning?.({
			code: 'path_unresolved',
			message: `Could not locate the skill folder for ${unresolved.join(', ')}; adopting that source imports every skill in the repository.`,
		});
}
