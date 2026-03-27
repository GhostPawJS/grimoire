import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { execGit, resolveGitDir } from './exec_git.ts';
import { createTestGitRoot } from './test-git.ts';

describe('resolveGitDir', () => {
	it('returns explicit gitDir when provided', () => {
		assert.equal(resolveGitDir('/foo/skills', '/bar/.git'), '/bar/.git');
	});

	it('defaults to sibling .grimoire-git when gitDir omitted', () => {
		assert.equal(resolveGitDir('/foo/skills'), resolve('/foo/skills', '..', '.grimoire-git'));
	});
});

describe('execGit', () => {
	it('runs a successful command and returns trimmed output', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [{ name: 'ch', spells: [{ name: 'sp' }] }],
		});
		try {
			seal();
			const log = execGit({ root, gitDir }, 'log --oneline');
			assert.ok(log.length > 0);
		} finally {
			cleanup();
		}
	});

	it('throws on a failed command', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			assert.throws(() => execGit({ root, gitDir }, 'log --oneline --no-walk HEAD'), {
				name: 'Error',
			});
		} finally {
			cleanup();
		}
	});
});
