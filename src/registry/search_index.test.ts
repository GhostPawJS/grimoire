import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { searchIndex } from './search_index.ts';
import { upsertIndexEntry } from './upsert_index_entry.ts';

describe('searchIndex', () => {
	it('returns entries matching name', () => {
		const db = createTestDb();
		upsertIndexEntry(db, {
			source: 'github',
			slug: 'a',
			name: 'Alpha Searchable',
			description: 'other',
		});
		upsertIndexEntry(db, {
			source: 'github',
			slug: 'b',
			name: 'Beta Other',
			description: 'nomatch',
		});

		const hits = searchIndex(db, 'Searchable');
		assert.equal(hits.length, 1);
		assert.equal(hits[0]?.slug, 'a');

		db.close();
	});

	it('returns entries matching description', () => {
		const db = createTestDb();
		upsertIndexEntry(db, {
			source: 'github',
			slug: 'x',
			name: 'Title',
			description: 'hidden needle phrase',
		});

		const hits = searchIndex(db, 'needle');
		assert.equal(hits.length, 1);
		assert.equal(hits[0]?.slug, 'x');

		db.close();
	});

	it('returns an empty array when nothing matches', () => {
		const db = createTestDb();
		upsertIndexEntry(db, {
			source: 'agentskillhub',
			slug: 'z',
			name: 'Only',
			description: 'here',
		});

		assert.deepEqual(searchIndex(db, 'zzznomatch'), []);

		db.close();
	});

	it('matches case-insensitively for ASCII', () => {
		const db = createTestDb();
		upsertIndexEntry(db, {
			source: 'github',
			slug: 'ci',
			name: 'MixedCase',
		});

		const lower = searchIndex(db, 'mixedcase');
		assert.equal(lower.length, 1);
		assert.equal(lower[0]?.slug, 'ci');

		db.close();
	});
});
