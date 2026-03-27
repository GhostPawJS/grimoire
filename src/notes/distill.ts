import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';

export function distill(db: GrimoireDb, noteId: number, spellPath: string): void {
	const result = db
		.prepare(
			"UPDATE spell_notes SET status = 'distilled', distilled_by = ? WHERE id = ? AND status = 'pending'",
		)
		.run(spellPath, noteId);
	if (Number(result.changes) === 0) {
		throw new GrimoireNotFoundError(`Note ${String(noteId)} not found or not pending`);
	}
}
