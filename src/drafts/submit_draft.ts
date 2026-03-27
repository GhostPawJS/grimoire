import type { GrimoireDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import type { SubmitDraftInput } from './types.ts';

export function submitDraft(db: GrimoireDb, input: SubmitDraftInput): { id: number } {
	const ts = resolveNow(input.now);
	const noteIdsJson = JSON.stringify(input.noteIds);
	const result = db
		.prepare(
			'INSERT INTO spell_drafts (title, rationale, note_ids, chapter, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
		)
		.run(input.title, input.rationale, noteIdsJson, input.chapter, 'pending', ts);
	return { id: Number(result.lastInsertRowid) };
}
