import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';
import { listNotes } from './list_notes.ts';

describe('listNotes', () => {
	it('filters by status and domain', () => {
		const db = createTestDb();
		dropNote(db, { source: 'a', content: 'x', domain: 'fire', now: 1 });
		const id2 = dropNote(db, { source: 'b', content: 'y', domain: 'water', now: 2 }).id;
		db.prepare("UPDATE spell_notes SET status = 'distilled' WHERE id = ?").run(id2);

		const firePending = listNotes(db, { domain: 'fire', status: 'pending' });
		assert.equal(firePending.length, 1);
		assert.equal(firePending[0]?.content, 'x');

		const distilled = listNotes(db, { status: 'distilled' });
		assert.equal(distilled.length, 1);
		assert.equal(distilled[0]?.domain, 'water');

		db.close();
	});

	it('supports pagination with limit and offset', () => {
		const db = createTestDb();
		dropNote(db, { source: 's', content: 'a', now: 1 });
		dropNote(db, { source: 's', content: 'b', now: 2 });
		dropNote(db, { source: 's', content: 'c', now: 3 });

		const page = listNotes(db, { limit: 2, offset: 1 });
		assert.deepEqual(
			page.map((n) => n.content),
			['b', 'a'],
		);

		db.close();
	});
});
