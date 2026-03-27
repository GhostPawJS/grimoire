import type { GrimoireDb } from '../database.ts';
import { mapProvenanceRow } from './map_provenance_row.ts';
import type { Provenance, ProvenanceRow } from './types.ts';

export function allProvenance(db: GrimoireDb): Provenance[] {
	return db
		.prepare(
			'SELECT spell_path, source_type, source_url, source_repo, source_path, source_commit, source_version, imported_at, updated_at FROM spell_provenance ORDER BY spell_path ASC',
		)
		.all<ProvenanceRow>()
		.map(mapProvenanceRow);
}
