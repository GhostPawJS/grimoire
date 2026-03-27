import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestGitRoot } from './test-git.ts';

function git(root: string, gitDir: string, args: string): string {
	return execSync(`git --work-tree="${root}" --git-dir="${gitDir}" ${args}`, {
		encoding: 'utf-8',
	}).trim();
}

describe('createTestGitRoot', () => {
	it('creates root and separate gitDir', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			assert.ok(existsSync(root));
			assert.ok(existsSync(gitDir));
			assert.ok(root !== gitDir);
		} finally {
			cleanup();
		}
	});

	it('initializes a bare git repo at gitDir', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		try {
			const isBare = git(root, gitDir, 'config --get core.bare');
			assert.equal(isBare, 'true');
		} finally {
			cleanup();
		}
	});

	it('creates spells from layout', () => {
		const { root, cleanup } = createTestGitRoot({
			chapters: [
				{
					name: 'engineering',
					spells: [{ name: 'deploy-vercel' }],
				},
			],
		});
		try {
			assert.ok(existsSync(join(root, 'engineering', 'deploy-vercel', 'SKILL.md')));
		} finally {
			cleanup();
		}
	});

	it('seal commits all changes and returns hash', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [
				{
					name: 'general',
					spells: [{ name: 'test-spell' }],
				},
			],
		});
		try {
			const hash = seal();
			assert.ok(/^[a-f0-9]{40}$/.test(hash));

			const log = git(root, gitDir, 'log --oneline');
			assert.ok(log.includes('seal'));
		} finally {
			cleanup();
		}
	});

	it('seal with specific paths only stages those paths', () => {
		const { root, gitDir, seal, cleanup } = createTestGitRoot({
			chapters: [
				{
					name: 'general',
					spells: [{ name: 'spell-a' }, { name: 'spell-b' }],
				},
			],
		});
		try {
			const hash = seal(['general/spell-a'], 'seal spell-a only');
			assert.ok(/^[a-f0-9]{40}$/.test(hash));

			const files = git(root, gitDir, 'show --name-only --format="" HEAD');
			assert.ok(files.includes('general/spell-a'));
			assert.ok(!files.includes('general/spell-b'));
		} finally {
			cleanup();
		}
	});

	it('cleanup removes everything', () => {
		const { root, gitDir, cleanup } = createTestGitRoot();
		cleanup();
		assert.ok(!existsSync(root));
		assert.ok(!existsSync(gitDir));
	});
});
