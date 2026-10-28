import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireConflictError, GrimoireNotFoundError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { commitIdentity } from '../git/commit_identity.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveInsideRoot, resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';

export function unshelve(
	root: string,
	shelvedPath: string,
	db?: GrimoireDb,
	options?: { force?: boolean; gitDir?: string },
): { path: string } {
	return withGitLock(resolveGitDir(root, options?.gitDir), () => {
		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }))
			assertGitScope({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, []);
		resolveSpellPath(root, shelvedPath, true);
		validateStagingPaths(root, [`.shelved/${shelvedPath}`, shelvedPath]);
		const source = resolveInsideRoot(root, '.shelved', shelvedPath);
		if (!existsSync(source)) {
			throw new GrimoireNotFoundError(`Shelved spell not found: .shelved/${shelvedPath}`);
		}

		const dest = resolveSpellPath(root, shelvedPath, true);
		if (existsSync(dest)) {
			if (!options?.force) throw new GrimoireConflictError(shelvedPath);
			rmSync(dest, { recursive: true, force: true });
		}
		mkdirSync(dirname(dest), { recursive: true });
		cpSync(source, dest, { recursive: true });
		rmSync(source, { recursive: true, force: true });

		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) })) {
			const paths = [shelvedPath, `.shelved/${shelvedPath}`];
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
				`unshelve ${shelvedPath}`,
				'--',
				...paths,
			]);
		}

		if (db) {
			try {
				updateProvenance(db, {
					spellPath: shelvedPath,
					sourceType: 'local',
				});
			} catch {
				// Provenance record may not exist.
			}
			logEvent(db, { spell: shelvedPath, event: 'unshelve' });
		}

		return { path: shelvedPath };
	});
}
