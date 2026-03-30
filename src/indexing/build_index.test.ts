import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
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

describe('buildIndex with explicit gitDir', () => {
	it('reads ranks from a custom gitDir location', () => {
		const {
			root: gitRoot,
			gitDir,
			seal,
			cleanup,
		} = createTestGitRoot({
			chapters: [
				{
					name: 'core',
					spells: [{ name: 'lumos' }, { name: 'nox' }],
				},
			],
		});
		try {
			seal(['core/lumos/SKILL.md'], 'first seal');
			// Write a new version so git records a real change in the second commit
			writeFileSync(
				join(gitRoot, 'core', 'lumos', 'SKILL.md'),
				'---\nname: lumos\ndescription: Updated\n---\n\n# lumos v2\n',
			);
			seal(['core/lumos/SKILL.md'], 'second seal');

			const entries = buildIndex(gitRoot, { gitDir });
			const lumos = entries.find((e) => e.name === 'lumos');
			const nox = entries.find((e) => e.name === 'nox');

			assert.ok(lumos, 'lumos should be in the index');
			assert.equal(lumos.rank, 2);

			// nox has rank 0 and git context is active, so it is filtered out
			assert.equal(nox, undefined);
		} finally {
			cleanup();
		}
	});
});
