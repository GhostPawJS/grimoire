import { nullableString } from '../lib/nullable_string.ts';
import type { RegistryEntry, RegistryEntryRow, RegistrySource } from './types.ts';

export function mapRegistryRow(row: RegistryEntryRow): RegistryEntry {
	return {
		id: Number(row.id),
		source: row.source as RegistrySource,
		slug: String(row.slug),
		name: String(row.name),
		description: nullableString(row.description),
		adoptionCount: row.adoption_count === null ? null : Number(row.adoption_count),
		sourceRepo: nullableString(row.source_repo),
		sourcePath: nullableString(row.source_path),
		fetchUrl: nullableString(row.fetch_url),
		lastSeen: String(row.last_seen),
	};
}
