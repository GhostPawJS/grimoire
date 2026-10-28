import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireConflictError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { commitIdentity } from '../git/commit_identity.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function moveSpell(
	root: string,
	from: string,
	to: string,
	db?: GrimoireDb,
	options?: { force?: boolean; gitDir?: string },
): { from: string; to: string } {
	return withGitLock(resolveGitDir(root, options?.gitDir), () => {
		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }))
			assertGitScope({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, []);
		validateStagingPaths(root, [from, to]);
		assertSpellExists(root, from);

		const source = resolveSpellPath(root, from);
		const dest = resolveSpellPath(root, to, true);
		if (existsSync(dest)) {
			if (!options?.force || dest === resolveSpellPath(root, from))
				throw new GrimoireConflictError(to);
			rmSync(dest, { recursive: true, force: true });
		}
		mkdirSync(dirname(dest), { recursive: true });
		cpSync(source, dest, { recursive: true });
		rmSync(source, { recursive: true, force: true });

		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) })) {
			const paths = [from, to];
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
				`move ${from} -> ${to}`,
				'--',
				...paths,
			]);
		}

		if (db) {
			try {
				updateProvenance(db, {
					spellPath: to,
					sourceType: 'local',
				});
			} catch {
				// Provenance may not exist for this spell.
			}
			logEvent(db, { spell: to, event: 'move' });
		}

		return { from, to };
	});
}
