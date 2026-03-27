import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';

export function deleteProvenance(db: GrimoireDb, spellPath: string): void {
	const result = db.prepare('DELETE FROM spell_provenance WHERE spell_path = ?').run(spellPath);
	if (Number(result.changes) === 0) {
		throw new GrimoireNotFoundError(`Provenance for ${spellPath} not found`);
	}
}
