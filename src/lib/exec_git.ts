import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface GitContext {
	root: string;
	gitDir?: string;
}

export function resolveGitDir(root: string, gitDir?: string): string {
	return gitDir ?? resolve(root, '..', '.grimoire-git');
}

export function execGit(ctx: GitContext, args: string): string {
	const dir = resolveGitDir(ctx.root, ctx.gitDir);
	return execSync(`git --work-tree="${ctx.root}" --git-dir="${dir}" ${args}`, {
		encoding: 'utf-8',
		timeout: 10_000,
		stdio: 'pipe',
	}).trim();
}
