import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { pendingChanges } from './pending_changes.ts';

describe('pendingChanges', () => {
	it('returns empty array when no changes', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			assert.deepEqual(pendingChanges({ root, gitDir }), []);
		} finally {
			cleanup();
		}
	});

	it('detects new untracked files as created', () => {
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			const results = pendingChanges({ root, gitDir });
			assert.ok(results.length >= 1);
			const spell = results.find((r) => r.spellPath === 'ch/sp');
			assert.ok(spell);
			assert.ok(spell.changes.some((c) => c.status === 'created'));
		} finally {
			cleanup();
		}
	});

	it('detects modified files', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			writeFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'modified');
			const results = pendingChanges({ root, gitDir });
			assert.ok(results.length >= 1);
			const spell = results.find((r) => r.spellPath === 'ch/sp');
			assert.ok(spell);
			assert.ok(spell.changes.some((c) => c.status === 'modified'));
		} finally {
			cleanup();
		}
	});

	it('filters to specific path', () => {
		const { root, gitDir, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'alpha' }, { name: 'beta' }] }],
		});
		try {
			const results = pendingChanges({ root, gitDir }, 'ch/alpha');
			for (const r of results) {
				assert.equal(r.spellPath, 'ch/alpha');
			}
		} finally {
			cleanup();
		}
	});
});
