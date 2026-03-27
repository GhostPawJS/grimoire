import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { deleteProvenance } from './delete_provenance.ts';
import { recordProvenance } from './record_provenance.ts';

describe('deleteProvenance', () => {
	it('deletes an existing row', () => {
		const db = createTestDb();
		recordProvenance(db, { spellPath: '/del', sourceType: 'local' });
		deleteProvenance(db, '/del');

		const count = db
			.prepare('SELECT COUNT(*) AS c FROM spell_provenance WHERE spell_path = ?')
			.get<{ c: number }>('/del');
		assert.equal(count?.c, 0);

		db.close();
	});

	it('throws when spell_path is missing', () => {
		const db = createTestDb();
		assert.throws(
			() => deleteProvenance(db, '/nope'),
			(err) => err instanceof GrimoireNotFoundError,
		);
		db.close();
	});
});
