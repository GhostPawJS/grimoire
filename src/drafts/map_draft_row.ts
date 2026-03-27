import type { DraftStatus, SpellDraft, SpellDraftRow } from './types.ts';

export function mapDraftRow(row: SpellDraftRow): SpellDraft {
	return {
		id: row.id,
		title: row.title,
		rationale: row.rationale,
		noteIds: JSON.parse(row.note_ids) as number[],
		chapter: row.chapter,
		status: row.status as DraftStatus,
		createdAt: row.created_at,
	};
}
