import { cpSync, existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { assertGitScope } from './assert_git_scope.ts';
import { execGit } from './exec_git.ts';
import { resolveInsideRoot } from './safe_path.ts';
import { withGitLock } from './with_git_lock.ts';

export function resolveGitDir(root: string, gitDir?: string): string {
	const destination = resolveInsideRoot(root, '.grimoire-git');
	if (gitDir !== undefined) {
		const explicit = resolve(gitDir);
		// A legacy store copied into this root redirects to the copy, so mixed explicit/default callers converge.
		const marker = resolve(explicit, 'MIGRATED_TO');
		if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === destination)
			return destination;
		return explicit;
	}
	const legacy = resolve(root, '..', '.grimoire-git');
	if (existsSync(destination) || !existsSync(legacy) || lstatSync(legacy).isSymbolicLink())
		return destination;
	return withGitLock(legacy, () => {
		if (existsSync(destination)) return destination;
		const ctx = { root, gitDir: legacy };
		let safe = false;
		try {
			let worktree = '';
			try {
				worktree = execGit(ctx, ['config', '--get', 'core.worktree']);
			} catch {
				/* Unconfigured legacy repositories are checked by their tree. */
			}
			if (worktree) safe = resolve(legacy, worktree) === resolve(root);
			else {
				const paths = execGit(ctx, ['ls-tree', '-r', '--name-only', 'HEAD'])
					.split('\n')
					.filter(Boolean);
				safe = paths.every((path) => {
					try {
						return existsSync(resolveInsideRoot(root, path));
					} catch {
						return false;
					}
				});
			}
			if (safe) assertGitScope(ctx, []);
		} catch {
			return destination;
		}
		if (!safe) return destination;
		cpSync(legacy, destination, {
			recursive: true,
			dereference: false,
			filter: (source) => basename(source) !== 'grimoire.lock',
		});
		writeFileSync(resolve(legacy, 'MIGRATED_TO'), `${destination}\n`);
		return destination;
	});
}
