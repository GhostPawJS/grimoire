import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { resolveGitDir } from './resolve_git_dir.ts';

test('default history is inside the root and explicit directories win; legacy symlinks are not migrated', () => {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-resolve-'));
	try {
		const root = join(dir, 'root');
		assert.equal(resolveGitDir(root), join(root, '.grimoire-git'));
		assert.equal(resolveGitDir(root, 'custom-history'), resolve('custom-history'));
		symlinkSync(root, join(dir, '.grimoire-git'), 'dir');
		assert.equal(resolveGitDir(root), join(root, '.grimoire-git'));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
