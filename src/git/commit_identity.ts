import { execGit, type GitContext } from '../lib/exec_git.ts';

export function commitIdentity(ctx: GitContext): string[] {
	try {
		if (execGit(ctx, ['config', 'user.email']) !== '') return [];
	} catch {
		// Use the default identity when none is configured.
	}
	return ['-c', 'user.name=grimoire', '-c', 'user.email=grimoire@localhost'];
}
