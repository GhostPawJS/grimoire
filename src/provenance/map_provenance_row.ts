import { nullableString } from '../lib/nullable_string.ts';
import type { Provenance, ProvenanceRow, ProvenanceSourceType } from './types.ts';

export function mapProvenanceRow(row: ProvenanceRow): Provenance {
	return {
		spellPath: String(row.spell_path),
		sourceType: String(row.source_type) as ProvenanceSourceType,
		sourceUrl: nullableString(row.source_url),
		sourceRepo: nullableString(row.source_repo),
		sourcePath: nullableString(row.source_path),
		sourceCommit: nullableString(row.source_commit),
		sourceVersion: nullableString(row.source_version),
		importedAt: String(row.imported_at),
		updatedAt: nullableString(row.updated_at),
	};
}
