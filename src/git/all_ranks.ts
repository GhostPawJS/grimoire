import { execGit } from '../lib/exec_git.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function allRanks(ctx: GitContext): Record<string, number> {
	if (!isGitAvailable()) return {};
	try {
		const output = execGit(ctx, 'log --name-only --format=""');
		if (output === '') return {};

		const counts: Record<string, number> = {};
		for (const line of output.split('\n')) {
			if (line === '') continue;
			const parts = line.split('/');
			if (parts.length < 2) continue;
			const first = parts[0];
			if (first === '.shelved') continue;
			const spellPath = `${first}/${parts[1]}`;
			counts[spellPath] = (counts[spellPath] ?? 0) + 1;
		}
		return counts;
	} catch {
		return {};
	}
}
