import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { sharedGitWarning } from './shared_git_warning.ts';

test('ignored parent history yields one warning, including resolved root-local contexts', () => {
	const fixture = createTestRoot();
	const root = join(fixture.root, 'nested');
	const gitDir = join(root, '.grimoire-git');
	const legacy = join(fixture.root, '.grimoire-git');
	try {
		mkdirSync(gitDir, { recursive: true });
		assert.deepEqual(sharedGitWarning({ root }), []);
		mkdirSync(legacy);
		assert.equal(sharedGitWarning({ root }).length, 1);
		assert.equal(sharedGitWarning({ root, gitDir }).length, 1);
		assert.deepEqual(sharedGitWarning({ root, gitDir: join(root, 'custom') }), []);
		writeFileSync(join(legacy, 'MIGRATED_TO'), `${gitDir}\n`);
		assert.deepEqual(sharedGitWarning({ root, gitDir }), []);
	} finally {
		fixture.cleanup();
	}
});
