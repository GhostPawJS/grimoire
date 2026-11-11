import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveGitDir } from '../lib/exec_git.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';
import { type ToolWarning, toolWarning } from './tool_types.ts';

export function sharedGitWarning(ctx: GrimoireToolContext): ToolWarning[] {
	if (ctx.gitDirExplicit) return [];
	const destination = resolve(ctx.root, '.grimoire-git');
	const legacy = resolve(ctx.root, '..', '.grimoire-git');
	const marker = resolve(legacy, 'MIGRATED_TO');
	return (!ctx.gitDir || resolve(ctx.gitDir) === destination) &&
		existsSync(legacy) &&
		resolveGitDir(ctx.root) === destination &&
		(!existsSync(marker) || readFileSync(marker, 'utf8').trim() !== destination)
		? [
				toolWarning(
					'shared_git_dir',
					'Ignored parent Git history that does not belong to this root; using the root-local repository.',
				),
			]
		: [];
}
