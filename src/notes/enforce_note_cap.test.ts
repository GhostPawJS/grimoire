import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';
import { enforceNoteCap } from './enforce_note_cap.ts';

describe('enforceNoteCap', () => {
	it('does nothing when pending count is under cap', () => {
		const db = createTestDb();
		dropNote(db, { source: 's', content: 'a', now: 1 });
		dropNote(db, { source: 's', content: 'b', now: 2 });

		const { expired } = enforceNoteCap(db, 10);
		assert.equal(expired, 0);

		const pending = db
			.prepare("SELECT COUNT(*) as c FROM spell_notes WHERE status = 'pending'")
			.get<{ c: number }>();
		assert.equal(Number(pending?.c), 2);

		db.close();
	});

	it('expires oldest pending notes beyond cap', () => {
		const db = createTestDb();
		const oldest = dropNote(db, { source: 's', content: 'first', now: 100 }).id;
		dropNote(db, { source: 's', content: 'second', now: 200 });
		const newest = dropNote(db, { source: 's', content: 'third', now: 300 }).id;

		const { expired } = enforceNoteCap(db, 2);
		assert.equal(expired, 1);

		const oldestStatus = db
			.prepare('SELECT status FROM spell_notes WHERE id = ?')
			.get<{ status: string }>(oldest);
		const newestStatus = db
			.prepare('SELECT status FROM spell_notes WHERE id = ?')
			.get<{ status: string }>(newest);
		assert.equal(oldestStatus?.status, 'expired');
		assert.equal(newestStatus?.status, 'pending');

		db.close();
	});
});
