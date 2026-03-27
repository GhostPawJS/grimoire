import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from './drop_note.ts';
import { noteCounts } from './note_counts.ts';

describe('noteCounts', () => {
	it('groups counts by source and domain', () => {
		const db = createTestDb();
		dropNote(db, { source: 'alpha', content: 'a', domain: 'fire', now: 1 });
		dropNote(db, { source: 'alpha', content: 'b', domain: 'fire', now: 2 });
		dropNote(db, { source: 'alpha', content: 'c', now: 3 });
		dropNote(db, { source: 'beta', content: 'd', domain: 'water', now: 4 });

		const rows = noteCounts(db).sort((a, b) => {
			if (a.source !== b.source) {
				return a.source.localeCompare(b.source);
			}
			if (a.domain === b.domain) {
				return 0;
			}
			if (a.domain === null) {
				return 1;
			}
			if (b.domain === null) {
				return -1;
			}
			return a.domain.localeCompare(b.domain);
		});

		assert.deepEqual(rows, [
			{ source: 'alpha', domain: 'fire', count: 2 },
			{ source: 'alpha', domain: null, count: 1 },
			{ source: 'beta', domain: 'water', count: 1 },
		]);

		db.close();
	});
});
