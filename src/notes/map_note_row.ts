import type { NoteStatus, SpellNote, SpellNoteRow } from './types.ts';

export function mapNoteRow(row: SpellNoteRow): SpellNote {
	return {
		id: Number(row.id),
		source: String(row.source),
		sourceId: row.source_id === null ? null : String(row.source_id),
		content: String(row.content),
		domain: row.domain === null ? null : String(row.domain),
		status: row.status as NoteStatus,
		distilledBy: row.distilled_by === null ? null : String(row.distilled_by),
		createdAt: Number(row.created_at),
	};
}
