import { resolve } from 'node:path';
import { resolveGitDir } from '../lib/exec_git.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';
import { type ToolWarning, toolWarning } from './tool_types.ts';

export function sharedGitWarning(ctx: GrimoireToolContext): ToolWarning[] {
	return resolveGitDir(ctx.root, ctx.gitDir) === resolve(ctx.root, '..', '.grimoire-git')
		? [
				toolWarning(
					'shared_git_dir',
					'Legacy Git history may be shared. Use --git-dir or GHOSTPAW_GRIMOIRE_GIT_DIR to select a dedicated repository. Copy history only after checking it belongs to this root; keep the legacy repository for other roots.',
				),
			]
		: [];
}
