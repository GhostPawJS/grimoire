import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';
import { pendingNotes } from './pending_notes.ts';

describe('pendingNotes', () => {
	it('returns only pending notes', () => {
		const db = createTestDb();
		const { id } = dropNote(db, { source: 's', content: 'p', now: 1 });
		dropNote(db, { source: 's', content: 'd', now: 2 });
		db.prepare("UPDATE spell_notes SET status = 'distilled' WHERE id = ?").run(id);

		const notes = pendingNotes(db);
		assert.equal(notes.length, 1);
		assert.equal(notes[0]?.content, 'd');

		db.close();
	});

	it('filters by domain when provided', () => {
		const db = createTestDb();
		dropNote(db, { source: 'a', content: 'x', domain: 'fire', now: 1 });
		dropNote(db, { source: 'b', content: 'y', domain: 'water', now: 2 });

		const fire = pendingNotes(db, 'fire');
		assert.equal(fire.length, 1);
		assert.equal(fire[0]?.content, 'x');

		db.close();
	});
});
