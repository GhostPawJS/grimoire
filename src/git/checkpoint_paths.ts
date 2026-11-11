import { execGit, type GitContext } from '../lib/exec_git.ts';
import { commitIdentity } from './commit_identity.ts';

/** Stage and checkpoint exactly the selected paths, preserving their order. */
export function checkpointPaths(ctx: GitContext, paths: string[], message: string): void {
	execGit(ctx, ['add', '-A', '--', ...paths]);
	execGit(ctx, [...commitIdentity(ctx), 'commit', '-m', message, '--', ...paths]);
}
