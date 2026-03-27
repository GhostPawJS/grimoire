import { execGit } from '../lib/exec_git.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext, RollbackResult } from './types.ts';

const REF_PATTERN = /^[a-f0-9]{4,40}$/;

export function rollback(ctx: GitContext, path: string, ref: string): RollbackResult {
	if (!REF_PATTERN.test(ref)) {
		return { success: false };
	}
	if (!isGitAvailable()) {
		return { success: false };
	}
	try {
		execGit(ctx, `checkout ${ref} -- "${path}/"`);
		return { success: true, restoredRef: ref };
	} catch {
		return { success: false };
	}
}
