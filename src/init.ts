import { existsSync, mkdirSync } from 'node:fs';
import type { GrimoireDb } from './database.ts';
import { DEFAULTS } from './defaults.ts';
import { commitIdentity } from './git/commit_identity.ts';
import { isGitAvailable } from './git/is_git_available.ts';
import { initGrimoireTables } from './init_grimoire_tables.ts';
import { execGit, initBareRepo, resolveGitDir } from './lib/exec_git.ts';
import { resolveInsideRoot } from './lib/safe_path.ts';
import { withGitLock } from './lib/with_git_lock.ts';

export function init(root: string, db?: GrimoireDb, options?: { gitDir?: string }): void {
	if (db) {
		initGrimoireTables(db);
	}

	mkdirSync(root, { recursive: true });
	mkdirSync(resolveInsideRoot(root, DEFAULTS.defaultChapter), { recursive: true });

	if (isGitAvailable()) {
		const gitDir = resolveGitDir(root, options?.gitDir);
		withGitLock(gitDir, () => {
			if (existsSync(resolveInsideRoot(gitDir, 'HEAD'))) return;
			initBareRepo(gitDir);
			execGit({ root, gitDir }, [
				...commitIdentity({ root, gitDir }),
				'commit',
				'--allow-empty',
				'-m',
				'init',
			]);
		});
	}
}
