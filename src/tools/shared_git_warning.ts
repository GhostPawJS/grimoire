import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveGitDir } from '../lib/exec_git.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';
import { type ToolWarning, toolWarning } from './tool_types.ts';

export function sharedGitWarning(ctx: GrimoireToolContext): ToolWarning[] {
	const legacy = resolve(ctx.root, '..', '.grimoire-git');
	const marker = resolve(legacy, 'MIGRATED_TO');
	return (!ctx.gitDir || resolve(ctx.gitDir) === resolve(ctx.root, '.grimoire-git')) &&
		existsSync(legacy) &&
		resolveGitDir(ctx.root) === resolve(ctx.root, '.grimoire-git') &&
		(!existsSync(marker) ||
			readFileSync(marker, 'utf8').trim() !== resolve(ctx.root, '.grimoire-git'))
		? [
				toolWarning(
					'shared_git_dir',
					'Ignored parent Git history that does not belong to this root; using the root-local repository.',
				),
			]
		: [];
}
