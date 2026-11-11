import type { GrimoireDb } from '../database.ts';
import { mapNoteRow } from './map_note_row.ts';
import type { SpellNote, SpellNoteRow } from './types.ts';

export function pendingNotes(db: GrimoireDb, domain?: string): SpellNote[] {
	return db
		.prepare(
			`SELECT * FROM spell_notes WHERE status = 'pending'${domain !== undefined ? ' AND domain = ?' : ''} ORDER BY id DESC`,
		)
		.all<SpellNoteRow>(...(domain !== undefined ? [domain] : []))
		.map(mapNoteRow);
}
