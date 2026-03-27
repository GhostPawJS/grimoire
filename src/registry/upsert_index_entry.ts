import type { GrimoireDb } from '../database.ts';
import type { UpsertRegistryEntryInput } from './types.ts';

export function upsertIndexEntry(db: GrimoireDb, input: UpsertRegistryEntryInput): { id: number } {
	const now = new Date().toISOString();
	const result = db
		.prepare(
			`INSERT INTO scout_index (source, slug, name, description, adoption_count, source_repo, source_path, fetch_url, last_seen)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(source, slug) DO UPDATE SET
			   name = excluded.name,
			   description = excluded.description,
			   adoption_count = excluded.adoption_count,
			   source_repo = excluded.source_repo,
			   source_path = excluded.source_path,
			   fetch_url = excluded.fetch_url,
			   last_seen = excluded.last_seen`,
		)
		.run(
			input.source,
			input.slug,
			input.name,
			input.description ?? null,
			input.adoptionCount ?? null,
			input.sourceRepo ?? null,
			input.sourcePath ?? null,
			input.fetchUrl ?? null,
			now,
		);
	return { id: Number(result.lastInsertRowid) };
}
