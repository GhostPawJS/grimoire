import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapRegistryRow } from './map_registry_row.ts';
import type { RegistryEntryRow } from './types.ts';

describe('mapRegistryRow', () => {
	it('maps snake_case row to camelCase RegistryEntry', () => {
		const row: RegistryEntryRow = {
			id: 7,
			source: 'github',
			slug: 'my-skill',
			name: 'My Skill',
			description: 'Does things',
			adoption_count: 42,
			source_repo: 'org/repo',
			source_path: 'skills/x.md',
			fetch_url: 'https://example.com/raw',
			last_seen: '2025-03-01T12:00:00.000Z',
		};
		assert.deepEqual(mapRegistryRow(row), {
			id: 7,
			source: 'github',
			slug: 'my-skill',
			name: 'My Skill',
			description: 'Does things',
			adoptionCount: 42,
			sourceRepo: 'org/repo',
			sourcePath: 'skills/x.md',
			fetchUrl: 'https://example.com/raw',
			lastSeen: '2025-03-01T12:00:00.000Z',
		});
	});
});
