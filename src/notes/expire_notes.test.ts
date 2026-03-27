import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';
import { expireNotes } from './expire_notes.ts';

describe('expireNotes', () => {
	it('expires old pending notes and leaves recent ones', () => {
		const db = createTestDb();
		const a = dropNote(db, { source: 's', content: 'old', now: 1_000 }).id;
		const b = dropNote(db, { source: 's', content: 'new', now: 5_000 }).id;

		const { expired } = expireNotes(db, 2_000, 5_000);
		assert.equal(expired, 1);

		const oldRow = db
			.prepare('SELECT status FROM spell_notes WHERE id = ?')
			.get<{ status: string }>(a);
		const newRow = db
			.prepare('SELECT status FROM spell_notes WHERE id = ?')
			.get<{ status: string }>(b);
		assert.equal(oldRow?.status, 'expired');
		assert.equal(newRow?.status, 'pending');

		db.close();
	});
});
