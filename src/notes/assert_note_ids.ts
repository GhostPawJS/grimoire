import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';

export function assertNoteIds(db: GrimoireDb, ids: number[]): void {
	const missing = ids.filter(
		(id) => !db.prepare('SELECT id FROM spell_notes WHERE id = ?').get(id),
	);
	if (missing.length)
		throw new GrimoireNotFoundError(
			`Notes not found: ${missing.join(', ')}. Review pending notes and retry with existing IDs.`,
		);
}
