import type { Provenance, ProvenanceRow, ProvenanceSourceType } from './types.ts';

export function mapProvenanceRow(row: ProvenanceRow): Provenance {
	return {
		spellPath: String(row.spell_path),
		sourceType: String(row.source_type) as ProvenanceSourceType,
		sourceUrl: row.source_url === null ? null : String(row.source_url),
		sourceRepo: row.source_repo === null ? null : String(row.source_repo),
		sourcePath: row.source_path === null ? null : String(row.source_path),
		sourceCommit: row.source_commit === null ? null : String(row.source_commit),
		sourceVersion: row.source_version === null ? null : String(row.source_version),
		importedAt: String(row.imported_at),
		updatedAt: row.updated_at === null ? null : String(row.updated_at),
	};
}
