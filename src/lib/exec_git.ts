import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface GitContext {
	root: string;
	gitDir?: string;
}

export function resolveGitDir(root: string, gitDir?: string): string {
	return gitDir ?? resolve(root, '..', '.grimoire-git');
}

export function execGit(
	ctx: GitContext,
	args: readonly string[],
	options?: { trim?: boolean },
): string {
	const dir = resolveGitDir(ctx.root, ctx.gitDir);
	const output = execFileSync('git', ['--work-tree', ctx.root, '--git-dir', dir, ...args], {
		encoding: 'utf-8',
		timeout: 10_000,
		stdio: 'pipe',
		shell: false,
	});
	return options?.trim === false ? output.trimEnd() : output.trim();
}
