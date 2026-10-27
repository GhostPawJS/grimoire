import { execGit } from '../lib/exec_git.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function diff(ctx: GitContext, path: string): string {
	resolveSpellPath(ctx.root, path);
	if (!isGitAvailable()) return '';
	try {
		return execGit(ctx, ['diff', '--', `${path}/`]);
	} catch {
		return '';
	}
}
