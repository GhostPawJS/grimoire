import type { GrimoireDb } from '../database.ts';
import { mapRegistryRow } from './map_registry_row.ts';
import type { RegistryEntry, RegistryEntryRow } from './types.ts';

export function searchIndex(db: GrimoireDb, query: string): RegistryEntry[] {
	const pattern = `%${query}%`;
	return db
		.prepare(
			`SELECT id, source, slug, name, description, adoption_count, source_repo, source_path, fetch_url, last_seen
			 FROM scout_index
			 WHERE name LIKE ? OR description LIKE ?
			 ORDER BY name ASC`,
		)
		.all<RegistryEntryRow>(pattern, pattern)
		.map(mapRegistryRow);
}
