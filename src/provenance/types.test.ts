import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Provenance, ProvenanceInput, ProvenanceRow, ProvenanceSourceType } from './types.ts';

describe('provenance/types', () => {
	it('can be imported', () => {
		const sourceType: ProvenanceSourceType = 'github';
		const row: ProvenanceRow = {
			spell_path: 's',
			source_type: 'github',
			source_url: null,
			source_repo: null,
			source_path: null,
			source_commit: null,
			source_version: null,
			imported_at: 't',
			updated_at: null,
		};
		const input: ProvenanceInput = { spellPath: 's', sourceType: 'local' };
		const prov: Provenance = {
			spellPath: 's',
			sourceType: 'local',
			sourceUrl: null,
			sourceRepo: null,
			sourcePath: null,
			sourceCommit: null,
			sourceVersion: null,
			importedAt: 't',
			updatedAt: null,
		};
		assert.equal(sourceType, 'github');
		assert.equal(row.spell_path, 's');
		assert.equal(input.spellPath, 's');
		assert.equal(prov.spellPath, 's');
	});
});
