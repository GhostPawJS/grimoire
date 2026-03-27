import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestRootLayout } from './test-root.ts';

function skillMd(name: string): string {
	return `---\nname: ${name}\ndescription: A test spell named ${name}\n---\n\n# ${name}\n\nBody content for ${name}.\n`;
}

function git(root: string, gitDir: string, args: string): string {
	return execSync(`git --work-tree="${root}" --git-dir="${gitDir}" ${args}`, {
		encoding: 'utf-8',
		env: {
			...process.env,
			GIT_AUTHOR_NAME: 'Test',
			GIT_AUTHOR_EMAIL: 'test@test.com',
			GIT_COMMITTER_NAME: 'Test',
			GIT_COMMITTER_EMAIL: 'test@test.com',
		},
	}).trim();
}

export function createTestGitRoot(layout?: TestRootLayout): {
	root: string;
	gitDir: string;
	seal: (paths?: string[], message?: string) => string;
	cleanup: () => void;
} {
	const base = mkdtempSync(join(tmpdir(), 'grimoire-test-git-'));
	const root = join(base, 'skills');
	const gitDir = join(base, '.grimoire-git');

	mkdirSync(root, { recursive: true });

	execSync(`git init --bare "${gitDir}"`, { encoding: 'utf-8' });

	if (layout?.chapters) {
		for (const chapter of layout.chapters) {
			for (const spell of chapter.spells) {
				const spellDir = join(root, chapter.name, spell.name);
				mkdirSync(spellDir, { recursive: true });
				writeFileSync(join(spellDir, 'SKILL.md'), spell.content ?? skillMd(spell.name));
			}
		}
	}

	function seal(paths?: string[], message?: string): string {
		if (paths && paths.length > 0) {
			for (const p of paths) {
				git(root, gitDir, `add "${join(root, p)}"`);
			}
		} else {
			git(root, gitDir, 'add -A');
		}
		const msg = message ?? 'seal';
		git(root, gitDir, `commit --allow-empty -m "${msg}"`);
		return git(root, gitDir, 'rev-parse HEAD');
	}

	return {
		root,
		gitDir,
		seal,
		cleanup: () => rmSync(base, { recursive: true, force: true }),
	};
}
