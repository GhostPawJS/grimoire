import { GrimoireStateError } from '../errors.ts';
import { execGit, type GitContext } from './exec_git.ts';
import { parseSpellPath } from './safe_path.ts';

export function assertGitScope(ctx: GitContext, _affected: string[]): void {
	for (const file of execGit(ctx, ['ls-files', '-z']).split('\0').filter(Boolean)) {
		let valid = true;
		try {
			const parts = file.split('/');
			if (parts[0] === '.shelved') parts.shift();
			parseSpellPath(parts.slice(0, 2).join('/'));
			if (parts.length < 3 || parts[0]?.startsWith('.')) valid = false;
			if (parts.some((part) => part === '..' || part === '.' || part === '')) valid = false;
		} catch {
			valid = false;
		}
		if (!valid)
			throw new GrimoireStateError(
				`Git tracks an unrelated path: ${file}. Use --git-dir or GHOSTPAW_GRIMOIRE_GIT_DIR to select a repository dedicated to this root; inspect history before migrating.`,
			);
	}
}
