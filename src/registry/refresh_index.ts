import type { GrimoireDb } from '../database.ts';
import type { RefreshIndexOptions, SearchResult } from './types.ts';
import { upsertIndexEntry } from './upsert_index_entry.ts';

const DEFAULT_TERMS = ['development', 'devops', 'data', 'testing', 'productivity', 'security'];

export async function refreshIndex(
	db: GrimoireDb,
	options?: RefreshIndexOptions,
): Promise<{ added: number; updated: number }> {
	const terms = options?.searchTerms ?? DEFAULT_TERMS;
	let added = 0;
	let updated = 0;

	for (const term of terms) {
		const url = `https://agentskillhub.dev/api/v1/search?q=${encodeURIComponent(term)}&limit=50`;
		const res = await fetch(url);
		if (!res.ok) continue;

		const items = (await res.json()) as SearchResult[];
		for (const item of items) {
			const existing = db
				.prepare('SELECT id FROM scout_index WHERE source = ? AND slug = ?')
				.get<{ id: number }>(item.source, item.slug);

			upsertIndexEntry(db, {
				source: item.source,
				slug: item.slug,
				name: item.name,
				description: item.description,
				sourceRepo: item.sourceRepo,
				fetchUrl: item.fetchUrl,
				...(item.adoptionCount !== undefined && { adoptionCount: item.adoptionCount }),
				...(item.sourcePath !== undefined && { sourcePath: item.sourcePath }),
			});

			if (existing) {
				updated++;
			} else {
				added++;
			}
		}
	}

	return { added, updated };
}
