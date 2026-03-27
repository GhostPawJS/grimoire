import type { GrimoireDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import type { LogEventInput } from './types.ts';

export function logEvent(db: GrimoireDb, input: LogEventInput): { id: number } {
	const ts = resolveNow(input.now);
	const result = db
		.prepare('INSERT INTO spell_events (spell, event, context_id, ts) VALUES (?, ?, ?, ?)')
		.run(input.spell, input.event, input.contextId ?? null, ts);
	return { id: Number(result.lastInsertRowid) };
}
