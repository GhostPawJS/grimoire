import { resolveSpellPath } from '../lib/safe_path.ts';
import { allRanks } from './all_ranks.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function rank(ctx: GitContext, path: string): number {
	resolveSpellPath(ctx.root, path);
	if (!isGitAvailable()) return 0;
	return allRanks(ctx)[path] ?? 0;
}
