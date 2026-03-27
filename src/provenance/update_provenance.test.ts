import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { recordProvenance } from './record_provenance.ts';
import type { ProvenanceRow } from './types.ts';
import { updateProvenance } from './update_provenance.ts';

describe('updateProvenance', () => {
	it('updates an existing row and sets updated_at', () => {
		const db = createTestDb();
		recordProvenance(db, {
			spellPath: '/x',
			sourceType: 'local',
		});

		updateProvenance(db, {
			spellPath: '/x',
			sourceType: 'github',
			sourceUrl: 'https://gh',
			sourceRepo: 'r',
			sourcePath: 'p',
			sourceCommit: 'c',
			sourceVersion: 'v',
		});

		const row = db
			.prepare(
				'SELECT source_type, source_url, updated_at FROM spell_provenance WHERE spell_path = ?',
			)
			.get<Pick<ProvenanceRow, 'source_type' | 'source_url' | 'updated_at'>>('/x');
		assert.equal(row?.source_type, 'github');
		assert.equal(row?.source_url, 'https://gh');
		assert.match(row?.updated_at ?? '', /^\d{4}-\d{2}-\d{2}T/);

		db.close();
	});

	it('throws when spell_path is missing', () => {
		const db = createTestDb();
		assert.throws(
			() =>
				updateProvenance(db, {
					spellPath: '/missing',
					sourceType: 'local',
				}),
			(err) => err instanceof GrimoireNotFoundError,
		);
		db.close();
	});
});
