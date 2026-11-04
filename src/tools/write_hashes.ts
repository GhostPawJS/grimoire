import { history } from '../git/history.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';

export function writeHashes(ctx: GrimoireToolContext, before: string | undefined, path?: string) {
	const git = { root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) };
	const latest = history(git)[0]?.hash;
	if (latest && latest !== before) return { commitHash: latest };
	const rollbackHash = history(git, path)[0]?.hash;
	return rollbackHash ? { rollbackHash } : {};
}
