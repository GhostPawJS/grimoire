import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNotes } from './drop_notes.ts';

describe('dropNotes', () => {
	it('returns empty ids for empty input', () => {
		const db = createTestDb();
		assert.deepEqual(dropNotes(db, []), { ids: [] });
		db.close();
	});

	it('batch inserts and returns ids in order', () => {
		const db = createTestDb();
		const { ids } = dropNotes(db, [
			{ source: 'a', content: 'one', now: 1 },
			{ source: 'b', content: 'two', now: 2 },
		]);
		assert.deepEqual(ids, [1, 2]);
		const count = db.prepare('SELECT COUNT(*) as c FROM spell_notes').get<{ c: number }>();
		assert.equal(Number(count?.c), 2);
		db.close();
	});
});
