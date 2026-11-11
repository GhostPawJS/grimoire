import { nullableString } from '../lib/nullable_string.ts';
import type { SpellEvent, SpellEventRow, SpellEventType } from './types.ts';

export function mapEventRow(row: SpellEventRow): SpellEvent {
	return {
		id: Number(row.id),
		spell: String(row.spell),
		event: row.event as SpellEventType,
		contextId: nullableString(row.context_id),
		ts: Number(row.ts),
	};
}
