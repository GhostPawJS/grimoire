import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestGitRoot } from '../lib/test-git.ts';
import { rollback } from './rollback.ts';

describe('rollback', () => {
	it('restores a file to a previous commit', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			const firstHash = seal();
			const original = readFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'utf-8');

			writeFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'changed');
			seal(undefined, 'update');

			const result = rollback({ root, gitDir }, 'ch/sp', firstHash);
			assert.equal(result.success, true);
			assert.equal(result.restoredRef, firstHash);

			const restored = readFileSync(join(root, 'ch', 'sp', 'SKILL.md'), 'utf-8');
			assert.equal(restored, original);
		} finally {
			cleanup();
		}
	});

	it('rejects invalid ref format', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			const result = rollback({ root, gitDir }, 'ch/sp', 'not-a-hash!');
			assert.equal(result.success, false);
			assert.equal(result.restoredRef, undefined);
		} finally {
			cleanup();
		}
	});

	it('returns failure for nonexistent ref', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			const result = rollback({ root, gitDir }, 'ch/sp', 'deadbeef');
			assert.equal(result.success, false);
		} finally {
			cleanup();
		}
	});
});
