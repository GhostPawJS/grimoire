import type { GrimoireDb } from '../database.ts';

export function enforceNoteCap(db: GrimoireDb, cap: number): { expired: number } {
	const result = db
		.prepare(
			"UPDATE spell_notes SET status = 'expired' WHERE status = 'pending' AND id NOT IN (SELECT id FROM spell_notes WHERE status = 'pending' ORDER BY created_at DESC LIMIT ?)",
		)
		.run(cap);
	return { expired: Number(result.changes) };
}
