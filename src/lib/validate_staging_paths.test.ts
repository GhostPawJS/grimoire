import assert from 'node:assert/strict';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createTestRoot } from './test-root.ts';
import { validateStagingPaths } from './validate_staging_paths.ts';

test('staging validates all descendants and directory components without following links', () => {
	const { root, cleanup } = createTestRoot();
	try {
		mkdirSync(join(root, 'general', 'safe'), { recursive: true });
		writeFileSync(join(root, 'general', 'safe', 'SKILL.md'), 'safe');
		validateStagingPaths(root, ['general/safe', 'general/missing']);
		assert.throws(
			() => validateStagingPaths(root, ['general/safe/SKILL.md/child']),
			/regular file or directory/,
		);
		symlinkSync('SKILL.md', join(root, 'general', 'safe', 'reference'));
		assert.throws(() => validateStagingPaths(root, ['general/safe']), /symbolic link/);
		symlinkSync('safe', join(root, 'general', 'linked'));
		assert.throws(() => validateStagingPaths(root, ['general/linked/SKILL.md']), /symbolic link/);
	} finally {
		cleanup();
	}
});
