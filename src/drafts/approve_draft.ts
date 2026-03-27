import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';

export function approveDraft(db: GrimoireDb, draftId: number): void {
	const result = db
		.prepare("UPDATE spell_drafts SET status = 'approved' WHERE id = ? AND status = 'pending'")
		.run(draftId);
	if (Number(result.changes) === 0) {
		throw new GrimoireNotFoundError(`Draft ${String(draftId)} not found or not pending`);
	}
}
