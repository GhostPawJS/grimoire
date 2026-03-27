import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { diff } from './diff.ts';

describe('diff', () => {
	it('returns empty string when no changes', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			assert.equal(diff({ root, gitDir }, 'ch/sp'), '');
		} finally {
			cleanup();
		}
	});

	it('returns diff output when files are modified', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			writeFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'new content');
			const output = diff({ root, gitDir }, 'ch/sp');
			assert.ok(output.includes('diff --git'));
			assert.ok(output.includes('new content'));
		} finally {
			cleanup();
		}
	});

	it('returns empty string for untracked path', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			assert.equal(diff({ root, gitDir }, 'nonexistent/path'), '');
		} finally {
			cleanup();
		}
	});
});
