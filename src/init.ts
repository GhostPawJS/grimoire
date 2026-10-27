import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import type { GrimoireDb } from './database.ts';
import { DEFAULTS } from './defaults.ts';
import { commitIdentity } from './git/commit_identity.ts';
import { isGitAvailable } from './git/is_git_available.ts';
import { initGrimoireTables } from './init_grimoire_tables.ts';
import { execGit, resolveGitDir } from './lib/exec_git.ts';
import { resolveInsideRoot } from './lib/safe_path.ts';

export function init(root: string, db?: GrimoireDb, options?: { gitDir?: string }): void {
	if (db) {
		initGrimoireTables(db);
	}

	mkdirSync(root, { recursive: true });
	mkdirSync(resolveInsideRoot(root, DEFAULTS.defaultChapter), { recursive: true });

	if (isGitAvailable()) {
		const gitDir = resolveGitDir(root, options?.gitDir);
		if (!existsSync(gitDir)) {
			execFileSync('git', ['init', '--bare', '--', gitDir], { stdio: 'pipe' });
			// Seed an empty commit so the repo is never in "no commits yet" limbo.
			// Without this, `git log` exits 128 on some git versions for an empty HEAD,
			// causing allRanks to return {} and seal to silently fail on every inscribe.
			execGit({ root, gitDir }, [
				...commitIdentity({ root, gitDir }),
				'commit',
				'--allow-empty',
				'-m',
				'init',
			]);
		}
	}
}
