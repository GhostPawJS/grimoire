import type { RegistryEntry, RegistryEntryRow, RegistrySource } from './types.ts';

export function mapRegistryRow(row: RegistryEntryRow): RegistryEntry {
	return {
		id: Number(row.id),
		source: row.source as RegistrySource,
		slug: String(row.slug),
		name: String(row.name),
		description: row.description === null ? null : String(row.description),
		adoptionCount: row.adoption_count === null ? null : Number(row.adoption_count),
		sourceRepo: row.source_repo === null ? null : String(row.source_repo),
		sourcePath: row.source_path === null ? null : String(row.source_path),
		fetchUrl: row.fetch_url === null ? null : String(row.fetch_url),
		lastSeen: String(row.last_seen),
	};
}
