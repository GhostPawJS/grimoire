import type { GrimoireDb } from '../database.ts';

export function pendingNoteCount(db: GrimoireDb): number {
	const row = db
		.prepare("SELECT COUNT(*) as count FROM spell_notes WHERE status = 'pending'")
		.get<{ count: number }>();
	return Number(row?.count ?? 0);
}
