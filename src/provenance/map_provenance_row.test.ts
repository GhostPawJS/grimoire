import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapProvenanceRow } from './map_provenance_row.ts';
import type { ProvenanceRow } from './types.ts';

describe('mapProvenanceRow', () => {
	it('maps a row with all fields', () => {
		const row: ProvenanceRow = {
			spell_path: '/spells/foo',
			source_type: 'github',
			source_url: 'https://example.com',
			source_repo: 'org/repo',
			source_path: 'skills/x.md',
			source_commit: 'abc123',
			source_version: '1.0.0',
			imported_at: '2025-01-01T00:00:00.000Z',
			updated_at: '2025-01-02T00:00:00.000Z',
		};
		assert.deepEqual(mapProvenanceRow(row), {
			spellPath: '/spells/foo',
			sourceType: 'github',
			sourceUrl: 'https://example.com',
			sourceRepo: 'org/repo',
			sourcePath: 'skills/x.md',
			sourceCommit: 'abc123',
			sourceVersion: '1.0.0',
			importedAt: '2025-01-01T00:00:00.000Z',
			updatedAt: '2025-01-02T00:00:00.000Z',
		});
	});

	it('maps a row with minimal nullable fields', () => {
		const row: ProvenanceRow = {
			spell_path: '/local/spell',
			source_type: 'local',
			source_url: null,
			source_repo: null,
			source_path: null,
			source_commit: null,
			source_version: null,
			imported_at: '2025-03-01T12:00:00.000Z',
			updated_at: null,
		};
		assert.deepEqual(mapProvenanceRow(row), {
			spellPath: '/local/spell',
			sourceType: 'local',
			sourceUrl: null,
			sourceRepo: null,
			sourcePath: null,
			sourceCommit: null,
			sourceVersion: null,
			importedAt: '2025-03-01T12:00:00.000Z',
			updatedAt: null,
		});
	});
});
