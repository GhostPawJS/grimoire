import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { buildIndex } from './build_index.ts';

const spell = (name: string, desc: string) =>
	`---\nname: ${name}\ndescription: ${desc}\n---\n\n# ${name}\n`;

describe('buildIndex', () => {
	let root: string;
	let cleanup: () => void;

	beforeEach(() => {
		const t = createTestRoot({
			chapters: [
				{
					name: 'core',
					spells: [
						{ name: 'git-rebase', content: spell('git-rebase', 'Interactive rebasing') },
						{ name: 'git-bisect', content: spell('git-bisect', 'Binary search bugs') },
					],
				},
				{
					name: 'ops',
					spells: [{ name: 'docker-build', content: spell('docker-build', 'Build images') }],
				},
			],
		});
		root = t.root;
		cleanup = t.cleanup;
	});

	afterEach(() => cleanup());

	it('builds index from discovered spells', () => {
		const entries = buildIndex(root);
		assert.equal(entries.length, 3);
		const names = entries.map((e) => e.name);
		assert.ok(names.includes('git-rebase'));
		assert.ok(names.includes('git-bisect'));
		assert.ok(names.includes('docker-build'));
	});

	it('sorts entries by rank descending then path ascending', () => {
		const entries = buildIndex(root);
		for (let i = 1; i < entries.length; i++) {
			const prev = entries[i - 1];
			const curr = entries[i];
			assert.ok(prev !== undefined);
			assert.ok(curr !== undefined);
			if (prev.rank === curr.rank) {
				assert.ok(prev.path <= curr.path);
			}
		}
	});

	it('filters by chapters when option provided', () => {
		const entries = buildIndex(root, { chapters: ['ops'] });
		assert.equal(entries.length, 1);
		assert.equal(entries[0]?.chapter, 'ops');
		assert.equal(entries[0]?.name, 'docker-build');
	});

	it('returns empty array for empty root', () => {
		const t = createTestRoot();
		try {
			const entries = buildIndex(t.root);
			assert.equal(entries.length, 0);
		} finally {
			t.cleanup();
		}
	});

	it('includes all spells when no git context', () => {
		const entries = buildIndex(root);
		assert.equal(entries.length, 3);
		for (const entry of entries) {
			assert.equal(entry.rank, 0);
			assert.equal(entry.tier, 'Uncheckpointed');
		}
	});

	it('skips spells with unparseable SKILL.md', () => {
		const badDir = join(root, 'core', 'broken-spell');
		mkdirSync(badDir, { recursive: true });
		writeFileSync(join(badDir, 'SKILL.md'), 'no frontmatter here');
		const entries = buildIndex(root);
		const names = entries.map((e) => e.name);
		assert.ok(!names.includes('broken-spell'));
	});
});
