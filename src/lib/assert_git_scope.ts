import { existsSync } from 'node:fs';
import { GrimoireStateError } from '../errors.ts';
import { execGit, type GitContext } from './exec_git.ts';
import { parseSpellPath, resolveInsideRoot } from './safe_path.ts';

export function assertGitScope(ctx: GitContext, affected: string[]): void {
	for (const file of execGit(ctx, ['ls-files', '-z']).split('\0').filter(Boolean)) {
		let valid = true;
		try {
			const parts = file.split('/');
			if (parts[0] === '.shelved') parts.shift();
			parseSpellPath(parts.slice(0, 2).join('/'));
			if (parts.length < 3 || parts[0]?.startsWith('.')) valid = false;
			const absolute = resolveInsideRoot(ctx.root, file);
			if (!existsSync(absolute) && !affected.some((path) => file.startsWith(`${path}/`)))
				valid = false;
		} catch {
			valid = false;
		}
		if (!valid)
			throw new GrimoireStateError(
				`Git tracks an unrelated or missing path: ${file}. Use --git-dir or GHOSTPAW_GRIMOIRE_GIT_DIR to select a repository dedicated to this root; inspect history before migrating.`,
			);
	}
}
