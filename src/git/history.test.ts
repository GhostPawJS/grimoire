import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { history } from './history.ts';

describe('history', () => {
	it('returns empty array with no commits', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			assert.deepEqual(history({ root, gitDir }), []);
		} finally {
			cleanup();
		}
	});

	it('returns history entries for all commits', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal(undefined, 'first seal');
			const entries = history({ root, gitDir });
			assert.ok(entries.length >= 1);
			assert.equal(entries[0]?.message, 'first seal');
			assert.ok(/^[a-f0-9]{40}$/.test(entries[0]?.hash ?? ''));
			assert.ok((entries[0]?.files.length ?? 0) > 0);
		} finally {
			cleanup();
		}
	});

	it('scopes history to a specific path', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'alpha' }, { name: 'beta' }] }],
		});
		try {
			seal(['ch/alpha'], 'seal alpha');
			seal(['ch/beta'], 'seal beta');
			const entries = history({ root, gitDir }, 'ch/alpha');
			assert.equal(entries.length, 1);
			assert.equal(entries[0]?.message, 'seal alpha');
		} finally {
			cleanup();
		}
	});

	it('parses date in ISO format', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			const entries = history({ root, gitDir });
			assert.ok(entries[0]?.date.includes('T'));
		} finally {
			cleanup();
		}
	});
});
