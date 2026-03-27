import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
	RefreshIndexOptions,
	RegistryEntry,
	RegistryEntryRow,
	RegistrySource,
	RepoAnalysis,
	SearchResult,
	SearchSkillsOptions,
	UpsertRegistryEntryInput,
} from './types.ts';

describe('registry types', () => {
	it('module can be imported', () => {
		const _row: RegistryEntryRow = {
			id: 1,
			source: 'github',
			slug: 's',
			name: 'n',
			description: null,
			adoption_count: null,
			source_repo: null,
			source_path: null,
			fetch_url: null,
			last_seen: '2025-01-01T00:00:00.000Z',
		};
		const _entry: RegistryEntry = {
			id: 1,
			source: 'github',
			slug: 's',
			name: 'n',
			description: null,
			adoptionCount: null,
			sourceRepo: null,
			sourcePath: null,
			fetchUrl: null,
			lastSeen: '2025-01-01T00:00:00.000Z',
		};
		const _source: RegistrySource = 'agentskillhub';
		const _input: UpsertRegistryEntryInput = { source: 'github', slug: 'x', name: 'y' };
		assert.ok(_row && _entry && _source && _input);
	});

	it('network types can be instantiated', () => {
		const _search: SearchResult = {
			source: 'agentskillhub',
			slug: 'test-skill',
			name: 'Test Skill',
			description: 'A test skill',
			sourceRepo: 'owner/repo',
			fetchUrl: 'https://example.com/skill.md',
		};
		const _opts: SearchSkillsOptions = { sources: ['github'], limit: 5 };
		const _analysis: RepoAnalysis = {
			repo: 'owner/repo',
			branch: 'main',
			skills: [{ name: 'skill', path: 'SKILL.md', description: 'desc' }],
		};
		const _refresh: RefreshIndexOptions = { searchTerms: ['test'] };
		assert.ok(_search && _opts && _analysis && _refresh);
	});
});
