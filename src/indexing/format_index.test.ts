import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatIndex } from './format_index.ts';
import type { IndexEntry } from './types.ts';

function entry(overrides: Partial<IndexEntry> = {}): IndexEntry {
	return {
		path: 'core/git-rebase',
		chapter: 'core',
		name: 'git-rebase',
		tier: 'Apprentice',
		rank: 1,
		description: 'Interactive rebasing',
		...overrides,
	};
}

describe('formatIndex', () => {
	it('returns empty-state message for no entries', () => {
		const result = formatIndex([]);
		assert.ok(result.includes('0 spells'));
		assert.ok(result.startsWith('## Grimoire'));
	});

	it('formats a single entry', () => {
		const result = formatIndex([entry()]);
		assert.ok(result.includes('1 spell'));
		assert.ok(!result.includes('1 spells'));
		assert.ok(result.includes('- core/git-rebase [Apprentice]: Interactive rebasing'));
	});

	it('formats multiple entries', () => {
		const entries = [
			entry(),
			entry({
				path: 'ops/docker-build',
				chapter: 'ops',
				name: 'docker-build',
				tier: 'Journeyman',
				rank: 4,
				description: 'Build images',
			}),
		];
		const result = formatIndex(entries);
		assert.ok(result.includes('2 spells'));
		assert.ok(result.includes('- core/git-rebase [Apprentice]: Interactive rebasing'));
		assert.ok(result.includes('- ops/docker-build [Journeyman]: Build images'));
	});

	it('includes earned procedures tagline', () => {
		const result = formatIndex([entry()]);
		assert.ok(result.includes('earned procedures from real experience'));
	});

	it('ends with newline', () => {
		const result = formatIndex([entry()]);
		assert.ok(result.endsWith('\n'));
	});
});
