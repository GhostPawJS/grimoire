import type { GrimoireDb } from '../database.ts';
import { mapEventRow } from './map_event_row.ts';
import type { SpellEvent, SpellEventRow } from './types.ts';

export function eventsSince(db: GrimoireDb, since: number): SpellEvent[] {
	const rows = db
		.prepare(
			'SELECT id, spell, event, context_id, ts FROM spell_events WHERE ts >= ? ORDER BY id ASC',
		)
		.all<SpellEventRow>(since);
	return rows.map(mapEventRow);
}
