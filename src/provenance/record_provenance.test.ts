import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { recordProvenance } from './record_provenance.ts';
import type { ProvenanceRow } from './types.ts';

describe('recordProvenance', () => {
	it('inserts a row with imported_at', () => {
		const db = createTestDb();
		recordProvenance(db, {
			spellPath: '/spells/imported',
			sourceType: 'agentskillhub',
			sourceUrl: 'https://hub.example/skill',
			sourceRepo: 'hub/pkg',
			sourcePath: 'skill.md',
			sourceCommit: 'deadbeef',
			sourceVersion: '2.1.0',
		});

		const row = db
			.prepare(
				'SELECT spell_path, source_type, source_url, source_repo, source_path, source_commit, source_version, imported_at, updated_at FROM spell_provenance WHERE spell_path = ?',
			)
			.get<ProvenanceRow>('/spells/imported');
		assert.ok(row);
		assert.equal(row?.spell_path, '/spells/imported');
		assert.equal(row?.source_type, 'agentskillhub');
		assert.equal(row?.source_url, 'https://hub.example/skill');
		assert.equal(row?.source_repo, 'hub/pkg');
		assert.equal(row?.source_path, 'skill.md');
		assert.equal(row?.source_commit, 'deadbeef');
		assert.equal(row?.source_version, '2.1.0');
		assert.match(row?.imported_at ?? '', /^\d{4}-\d{2}-\d{2}T/);
		assert.equal(row?.updated_at, null);

		db.close();
	});
});
