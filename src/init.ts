import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from './database.ts';
import { DEFAULTS } from './defaults.ts';
import { isGitAvailable } from './git/is_git_available.ts';
import { initGrimoireTables } from './init_grimoire_tables.ts';
import { resolveGitDir } from './lib/exec_git.ts';

export function init(root: string, db?: GrimoireDb, options?: { gitDir?: string }): void {
	if (db) {
		initGrimoireTables(db);
	}

	mkdirSync(root, { recursive: true });
	mkdirSync(join(root, DEFAULTS.defaultChapter), { recursive: true });

	if (isGitAvailable()) {
		const gitDir = resolveGitDir(root, options?.gitDir);
		if (!existsSync(gitDir)) {
			execSync(`git init --bare "${gitDir}"`);
			// Seed an empty commit so the repo is never in "no commits yet" limbo.
			// Without this, `git log` exits 128 on some git versions for an empty HEAD,
			// causing allRanks to return {} and seal to silently fail on every inscribe.
			execSync(
				`git -c user.name=grimoire -c user.email=grimoire@localhost` +
					` --work-tree="${root}" --git-dir="${gitDir}"` +
					` commit --allow-empty -m "init"`,
				{ encoding: 'utf-8', stdio: 'pipe' },
			);
		}
	}
}
