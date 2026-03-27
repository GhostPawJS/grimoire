import type { GrimoireDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { normalizeNoteContent } from './normalize_note_content.ts';
import type { DropNoteInput } from './types.ts';

export function dropNote(db: GrimoireDb, input: DropNoteInput): { id: number } {
	const ts = resolveNow(input.now);
	const content = normalizeNoteContent(input.content);
	const result = db
		.prepare(
			'INSERT INTO spell_notes (source, source_id, content, domain, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
		)
		.run(input.source, input.sourceId ?? null, content, input.domain ?? null, 'pending', ts);
	return { id: Number(result.lastInsertRowid) };
}
