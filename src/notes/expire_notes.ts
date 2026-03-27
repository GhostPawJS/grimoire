import type { GrimoireDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

export function expireNotes(db: GrimoireDb, maxAgeMs: number, now?: number): { expired: number } {
	const ts = resolveNow(now);
	const cutoff = ts - maxAgeMs;
	const result = db
		.prepare(
			"UPDATE spell_notes SET status = 'expired' WHERE status = 'pending' AND created_at < ?",
		)
		.run(cutoff);
	return { expired: Number(result.changes) };
}
