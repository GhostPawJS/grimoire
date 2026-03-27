import type { GrimoireDb } from '../database.ts';
import { mapProvenanceRow } from './map_provenance_row.ts';
import type { Provenance, ProvenanceRow } from './types.ts';

export function getProvenance(db: GrimoireDb, spellPath: string): Provenance | undefined {
	const row = db
		.prepare(
			'SELECT spell_path, source_type, source_url, source_repo, source_path, source_commit, source_version, imported_at, updated_at FROM spell_provenance WHERE spell_path = ?',
		)
		.get<ProvenanceRow>(spellPath);
	return row ? mapProvenanceRow(row) : undefined;
}
