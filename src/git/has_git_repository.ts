import { existsSync } from 'node:fs';
import { type GitContext, resolveGitDir } from '../lib/exec_git.ts';
import { resolveInsideRoot } from '../lib/safe_path.ts';
import { isGitAvailable } from './is_git_available.ts';

export function hasGitRepository(ctx: GitContext): boolean {
	return (
		isGitAvailable() && existsSync(resolveInsideRoot(resolveGitDir(ctx.root, ctx.gitDir), 'HEAD'))
	);
}
