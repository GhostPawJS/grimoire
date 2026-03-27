import { execGit } from '../lib/exec_git.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function diff(ctx: GitContext, path: string): string {
	if (!isGitAvailable()) return '';
	try {
		return execGit(ctx, `diff -- "${path}/"`);
	} catch {
		return '';
	}
}
