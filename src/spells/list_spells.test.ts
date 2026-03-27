import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { listSpells } from './list_spells.ts';

describe('listSpells', () => {
	it('lists spells with parsed frontmatter data', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{ name: 'engineering', spells: [{ name: 'deploy' }] },
				{ name: 'general', spells: [{ name: 'writing' }] },
			],
		});
		try {
			const spells = listSpells(root);
			assert.equal(spells.length, 2);

			const deploy = spells.find((s) => s.name === 'deploy');
			assert.ok(deploy);
			assert.equal(deploy.chapter, 'engineering');
			assert.equal(deploy.path, 'engineering/deploy');
			assert.equal(deploy.tier, 'Uncheckpointed');
			assert.equal(deploy.rank, 0);
			assert.ok(deploy.frontmatter.name === 'deploy');
		} finally {
			cleanup();
		}
	});

	it('filters by chapters', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{ name: 'engineering', spells: [{ name: 'deploy' }] },
				{ name: 'general', spells: [{ name: 'writing' }] },
			],
		});
		try {
			const spells = listSpells(root, { chapters: ['general'] });
			assert.equal(spells.length, 1);
			assert.equal(spells[0]?.chapter, 'general');
		} finally {
			cleanup();
		}
	});

	it('returns empty for empty root', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const spells = listSpells(root);
			assert.deepEqual(spells, []);
		} finally {
			cleanup();
		}
	});
});
