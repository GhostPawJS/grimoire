import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { getProvenance } from './get_provenance.ts';
import { recordProvenance } from './record_provenance.ts';

describe('getProvenance', () => {
	it('returns provenance when present', () => {
		const db = createTestDb();
		recordProvenance(db, {
			spellPath: '/g',
			sourceType: 'github',
			sourceRepo: 'a/b',
		});

		const p = getProvenance(db, '/g');
		assert.ok(p);
		assert.equal(p?.spellPath, '/g');
		assert.equal(p?.sourceType, 'github');
		assert.equal(p?.sourceRepo, 'a/b');

		db.close();
	});

	it('returns undefined when missing', () => {
		const db = createTestDb();
		assert.equal(getProvenance(db, '/none'), undefined);
		db.close();
	});
});
