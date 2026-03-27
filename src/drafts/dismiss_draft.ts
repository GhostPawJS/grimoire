import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';

export function dismissDraft(db: GrimoireDb, draftId: number): void {
	const result = db
		.prepare("UPDATE spell_drafts SET status = 'dismissed' WHERE id = ? AND status = 'pending'")
		.run(draftId);
	if (Number(result.changes) === 0) {
		throw new GrimoireNotFoundError(`Draft ${String(draftId)} not found or not pending`);
	}
}
