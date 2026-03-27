import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { rank } from './rank.ts';

describe('rank', () => {
	it('returns 0 for a path with no commits', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			assert.equal(rank({ root, gitDir }, 'ch/other'), 0);
		} finally {
			cleanup();
		}
	});

	it('counts commits touching a spell path', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal(['ch/sp'], 'first');
			writeFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'updated v2');
			seal(['ch/sp'], 'second');
			assert.equal(rank({ root, gitDir }, 'ch/sp'), 2);
		} finally {
			cleanup();
		}
	});

	it('returns 1 after a single seal', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'a', spells: [{ name: 'b' }] }],
		});
		try {
			seal();
			assert.equal(rank({ root, gitDir }, 'a/b'), 1);
		} finally {
			cleanup();
		}
	});
});
