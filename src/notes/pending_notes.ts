import type { GrimoireDb } from '../database.ts';
import { mapNoteRow } from './map_note_row.ts';
import type { SpellNote, SpellNoteRow } from './types.ts';

export function pendingNotes(db: GrimoireDb, domain?: string): SpellNote[] {
	if (domain !== undefined) {
		return db
			.prepare(
				"SELECT id, source, source_id, content, domain, status, distilled_by, created_at FROM spell_notes WHERE status = 'pending' AND domain = ? ORDER BY id DESC",
			)
			.all<SpellNoteRow>(domain)
			.map(mapNoteRow);
	}
	return db
		.prepare(
			"SELECT id, source, source_id, content, domain, status, distilled_by, created_at FROM spell_notes WHERE status = 'pending' ORDER BY id DESC",
		)
		.all<SpellNoteRow>()
		.map(mapNoteRow);
}
