#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const TERMS = ['development', 'devops', 'testing', 'docker', 'typescript', 'git', 'productivity'];

const OUT = join(process.cwd(), 'src', 'demo', 'demo_registry_snapshot.json');

async function main() {
	const seen = new Set();
	const rows = [];

	for (const term of TERMS) {
		const url = `https://agentskillhub.dev/api/v1/search?q=${encodeURIComponent(term)}&limit=30`;
		try {
			const res = await fetch(url, { headers: { Accept: 'application/json' } });
			if (!res.ok) continue;
			const data = await res.json();
			const items = Array.isArray(data) ? data : (data.skills ?? data.items ?? []);
			for (const item of items) {
				const slug = String(item.slug ?? item.name ?? '');
				if (!slug || seen.has(slug)) continue;
				seen.add(slug);
				const sourceRepo =
					item.sourceRepo ??
					item.sourceIdentifier?.replace?.(/^github:/, '') ??
					item.source_repo ??
					null;
				const fetchUrl =
					item.fetchUrl ??
					item.fetch_url ??
					(sourceRepo && item.path
						? `https://raw.githubusercontent.com/${item.sourceIdentifier}/HEAD/${item.path}`
						: null);
				rows.push({
					source: 'agentskillhub',
					slug,
					name: String(item.name ?? slug),
					description: String(item.description ?? ''),
					adoptionCount: typeof item.totalInstalls === 'number' ? item.totalInstalls : 0,
					sourceRepo,
					sourcePath: item.sourcePath ?? item.path ?? null,
					fetchUrl,
				});
			}
		} catch {
			// skip term
		}
	}

	const fallback = [
		{
			source: 'agentskillhub',
			slug: 'demo-fallback',
			name: 'demo-fallback',
			description: 'Local fallback when registry seed API is unavailable.',
			adoptionCount: 0,
			sourceRepo: 'anthropics/skills',
			sourcePath: 'skill-creator/SKILL.md',
			fetchUrl: 'https://raw.githubusercontent.com/anthropics/skills/main/skill-creator/SKILL.md',
		},
	];

	const out = rows.length > 0 ? rows : fallback;
	await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');
	console.log(`Wrote ${String(out.length)} entries to ${OUT}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
