import type { GrimoireDb } from '../database.ts';
import { mapDraftRow } from './map_draft_row.ts';
import type { SpellDraft, SpellDraftRow } from './types.ts';

export function pendingDrafts(db: GrimoireDb): SpellDraft[] {
	const rows = db
		.prepare("SELECT * FROM spell_drafts WHERE status = 'pending' ORDER BY id DESC")
		.all<SpellDraftRow>();
	return rows.map(mapDraftRow);
}
