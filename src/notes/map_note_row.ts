import { nullableString } from '../lib/nullable_string.ts';
import type { NoteStatus, SpellNote, SpellNoteRow } from './types.ts';

export function mapNoteRow(row: SpellNoteRow): SpellNote {
	return {
		id: Number(row.id),
		source: String(row.source),
		sourceId: nullableString(row.source_id),
		content: String(row.content),
		domain: nullableString(row.domain),
		status: row.status as NoteStatus,
		distilledBy: nullableString(row.distilled_by),
		createdAt: Number(row.created_at),
	};
}
