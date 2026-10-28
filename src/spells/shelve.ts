import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { logEvent } from '../events/log_event.ts';
import { commitIdentity } from '../git/commit_identity.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveInsideRoot, resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function shelve(
	root: string,
	path: string,
	db?: GrimoireDb,
	options?: { gitDir?: string },
): { path: string } {
	return withGitLock(resolveGitDir(root, options?.gitDir), () => {
		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }))
			assertGitScope({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, []);
		validateStagingPaths(root, [path]);
		assertSpellExists(root, path);

		const source = resolveSpellPath(root, path);
		const shelvedPath = resolveInsideRoot(root, '.shelved', path);

		mkdirSync(dirname(shelvedPath), { recursive: true });
		cpSync(source, shelvedPath, { recursive: true });
		rmSync(source, { recursive: true, force: true });

		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) })) {
			const paths = [path, `.shelved/${path}`];
			execGit({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, [
				'add',
				'-A',
				'--',
				...paths,
			]);
			execGit({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, [
				...commitIdentity({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }),
				'commit',
				'-m',
				`shelve ${path}`,
				'--',
				...paths,
			]);
		}

		if (db) {
			logEvent(db, { spell: path, event: 'shelve' });
		}

		return { path: `.shelved/${path}` };
	});
}
