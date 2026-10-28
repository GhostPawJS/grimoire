import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveGitDir } from './resolve_git_dir.ts';
import { validateStagingPaths } from './validate_staging_paths.ts';

export { resolveGitDir } from './resolve_git_dir.ts';

export interface GitContext {
	root: string;
	gitDir?: string;
}

export function execGit(
	ctx: GitContext,
	args: readonly string[],
	options?: { trim?: boolean },
): string {
	if (args[0] === 'add') {
		const separator = args.indexOf('--');
		validateStagingPaths(
			ctx.root,
			separator < 0
				? args.slice(1).filter((arg) => !arg.startsWith('-'))
				: args.slice(separator + 1),
		);
	}
	const dir = resolveGitDir(ctx.root, ctx.gitDir);
	const output = execFileSync('git', ['--work-tree', ctx.root, '--git-dir', dir, ...args], {
		encoding: 'utf-8',
		timeout: 10_000,
		stdio: 'pipe',
		shell: false,
	});
	return options?.trim === false ? output.trimEnd() : output.trim();
}

export function initBareRepo(gitDir: string): void {
	execFileSync('git', ['init', '--bare', '--quiet', '--', gitDir], {
		encoding: 'utf-8',
		timeout: 10_000,
		stdio: 'pipe',
		shell: false,
	});
	mkdirSync(join(gitDir, 'info'), { recursive: true });
	writeFileSync(join(gitDir, 'info', 'exclude'), '/.grimoire-git/\n');
}
