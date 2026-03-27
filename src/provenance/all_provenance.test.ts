import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { allProvenance } from './all_provenance.ts';
import { recordProvenance } from './record_provenance.ts';

describe('allProvenance', () => {
	it('returns all rows ordered by spell_path', () => {
		const db = createTestDb();
		recordProvenance(db, { spellPath: '/z', sourceType: 'local' });
		recordProvenance(db, { spellPath: '/a', sourceType: 'github' });
		recordProvenance(db, { spellPath: '/m', sourceType: 'agentskillhub' });

		const paths = allProvenance(db).map((p) => p.spellPath);
		assert.deepEqual(paths, ['/a', '/m', '/z']);

		db.close();
	});

	it('returns an empty array when there are no rows', () => {
		const db = createTestDb();
		assert.deepEqual(allProvenance(db), []);
		db.close();
	});
});
