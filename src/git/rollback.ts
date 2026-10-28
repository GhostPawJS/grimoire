import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { hasGitRepository } from './has_git_repository.ts';
import { isGitAvailable } from './is_git_available.ts';
import { seal } from './seal.ts';
import type { GitContext, RollbackResult } from './types.ts';

const REF_PATTERN = /^[a-f0-9]{4,40}$/;

export function rollback(ctx: GitContext, path: string, ref: string): RollbackResult {
	return withGitLock(resolveGitDir(ctx.root, ctx.gitDir), () => {
		if (!REF_PATTERN.test(ref)) {
			return { success: false };
		}
		resolveSpellPath(ctx.root, path);
		if (!isGitAvailable() || !hasGitRepository(ctx)) {
			return { success: false };
		}
		assertGitScope(ctx, []);
		try {
			execGit(ctx, ['cat-file', '-e', `${ref}^{commit}`]);
			const tree = execGit(ctx, ['ls-tree', '-r', ref, '--', `${path}/`]);
			if (
				tree
					.split('\n')
					.some((line) => line && !line.startsWith('100644 ') && !line.startsWith('100755 '))
			)
				return { success: false };
			validateStagingPaths(ctx.root, [path]);
			execGit(ctx, ['checkout', ref, '--', `${path}/`]);
		} catch {
			return { success: false };
		}
		seal(ctx, undefined, [path], `rollback ${path} to ${ref}\n\nGrimoire-Rollback: ${ref}`);
		return { success: true, restoredRef: ref };
	});
}
