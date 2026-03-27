import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { discoverSpells } from './discover_spells.ts';

describe('discoverSpells', () => {
	it('discovers spells across chapters', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{ name: 'engineering', spells: [{ name: 'deploy' }, { name: 'testing' }] },
				{ name: 'general', spells: [{ name: 'writing' }] },
			],
		});
		try {
			const spells = discoverSpells(root);
			assert.equal(spells.length, 3);
			const paths = spells.map((s) => s.path).sort();
			assert.deepEqual(paths, ['engineering/deploy', 'engineering/testing', 'general/writing']);
		} finally {
			cleanup();
		}
	});

	it('excludes dot-prefixed directories', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			mkdirSync(join(root, '.shelved', 'hidden-spell'), { recursive: true });
			mkdirSync(join(root, 'general', '.draft'), { recursive: true });
			const spells = discoverSpells(root);
			assert.equal(spells.length, 1);
			assert.equal(spells[0]?.path, 'general/writing');
		} finally {
			cleanup();
		}
	});

	it('returns empty array for empty root', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const spells = discoverSpells(root);
			assert.deepEqual(spells, []);
		} finally {
			cleanup();
		}
	});
});
