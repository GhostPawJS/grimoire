import type { GrimoireDb } from '../database.ts';
import { withTransaction } from '../with_transaction.ts';
import { dropNote } from './drop_note.ts';
import type { DropNoteInput } from './types.ts';

export function dropNotes(db: GrimoireDb, inputs: DropNoteInput[]): { ids: number[] } {
	return withTransaction(db, () => {
		const ids = inputs.map((input) => dropNote(db, input).id);
		return { ids };
	});
}
