import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { allRanks } from './all_ranks.ts';

describe('allRanks', () => {
	it('returns empty object with no commits', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			assert.deepEqual(allRanks({ root, gitDir }), {});
		} finally {
			cleanup();
		}
	});

	it('counts commits per spell path', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'alpha' }, { name: 'beta' }] }],
		});
		try {
			seal(['ch/alpha'], 'seal alpha 1');
			writeFileSync(join(root, 'ch', 'alpha', 'SKILL.md'), 'updated v2');
			seal(['ch/alpha'], 'seal alpha 2');
			seal(['ch/beta'], 'seal beta 1');

			const ranks = allRanks({ root, gitDir });
			assert.equal(ranks['ch/alpha'], 2);
			assert.equal(ranks['ch/beta'], 1);
		} finally {
			cleanup();
		}
	});

	it('excludes .shelved paths', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			mkdirSync(join(root, '.shelved', 'old-spell'), { recursive: true });
			writeFileSync(join(root, '.shelved', 'old-spell', 'SKILL.md'), 'shelved');
			seal();

			const ranks = allRanks({ root, gitDir });
			assert.equal(ranks['.shelved/old-spell'], undefined);
		} finally {
			cleanup();
		}
	});
});
