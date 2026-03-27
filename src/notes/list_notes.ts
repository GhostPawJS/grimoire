import type { GrimoireDb } from '../database.ts';
import { mapNoteRow } from './map_note_row.ts';
import type { NoteListOptions, SpellNote, SpellNoteRow } from './types.ts';

export function listNotes(db: GrimoireDb, options: NoteListOptions = {}): SpellNote[] {
	const conditions: string[] = [];
	const params: unknown[] = [];

	if (options.status !== undefined) {
		conditions.push('status = ?');
		params.push(options.status);
	}
	if (options.domain !== undefined) {
		conditions.push('domain = ?');
		params.push(options.domain);
	}

	const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
	const limit = options.limit ?? 100;
	const offset = options.offset ?? 0;

	const rows = db
		.prepare(
			`SELECT id, source, source_id, content, domain, status, distilled_by, created_at FROM spell_notes ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
		)
		.all<SpellNoteRow>(...params, limit, offset);
	return rows.map(mapNoteRow);
}
