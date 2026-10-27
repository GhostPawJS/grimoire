import { execGit } from '../lib/exec_git.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function rank(ctx: GitContext, path: string): number {
	resolveSpellPath(ctx.root, path);
	if (!isGitAvailable()) return 0;
	try {
		const output = execGit(ctx, ['log', '--oneline', '--', `${path}/`]);
		if (output === '') return 0;
		return output.split('\n').length;
	} catch {
		return 0;
	}
}
