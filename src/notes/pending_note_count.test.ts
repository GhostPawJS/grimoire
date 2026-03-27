import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';
import { pendingNoteCount } from './pending_note_count.ts';

describe('pendingNoteCount', () => {
	it('counts pending notes', () => {
		const db = createTestDb();
		assert.equal(pendingNoteCount(db), 0);

		dropNote(db, { source: 's', content: 'a', now: 1 });
		dropNote(db, { source: 's', content: 'b', now: 2 });
		assert.equal(pendingNoteCount(db), 2);

		db.close();
	});
});
