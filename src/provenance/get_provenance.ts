import type { GrimoireDb } from '../database.ts';
import { mapProvenanceRow } from './map_provenance_row.ts';
import type { Provenance, ProvenanceRow } from './types.ts';

export function getProvenance(db: GrimoireDb, spellPath: string): Provenance | undefined {
	const row = db
		.prepare('SELECT * FROM spell_provenance WHERE spell_path = ?')
		.get<ProvenanceRow>(spellPath);
	return row ? mapProvenanceRow(row) : undefined;
}
