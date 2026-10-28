import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { commitIdentity } from '../git/commit_identity.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { deleteProvenance } from '../provenance/delete_provenance.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function deleteSpell(
	root: string,
	path: string,
	db?: GrimoireDb,
	options?: { gitDir?: string },
): void {
	withGitLock(resolveGitDir(root, options?.gitDir), () => {
		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }))
			assertGitScope({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, []);
		resolveSpellPath(root, path);
		validateStagingPaths(root, [path]);
		if (existsSync(join(root, path))) assertSpellExists(root, path);
		else if (
			!hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }) ||
			!execGit({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) }, [
				'ls-files',
				'--',
				`${path}/`,
			])
		)
			assertSpellExists(root, path);
		const absolutePath = join(root, path);
		rmSync(absolutePath, { recursive: true, force: true });

		if (hasGitRepository({ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) })) {
			const ctx = { root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) };
			execGit(ctx, ['add', '-A', '--', path]);
			execGit(ctx, [...commitIdentity(ctx), 'commit', '-m', `delete ${path}`, '--', path]);
		}
		if (db) {
			db.prepare('DELETE FROM spell_events WHERE spell = ?').run(path);
			try {
				deleteProvenance(db, path);
			} catch {
				// Provenance may not exist; ignore.
			}
		}
	});
}
