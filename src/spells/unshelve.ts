import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireConflictError, GrimoireNotFoundError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { checkpointPaths } from '../git/checkpoint_paths.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
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
		const ctx = { root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) };
		if (hasGitRepository(ctx)) assertGitScope(ctx, []);
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

		if (hasGitRepository(ctx)) {
			const paths = [shelvedPath, `.shelved/${shelvedPath}`];
			checkpointPaths(ctx, paths, `unshelve ${shelvedPath}`);
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
