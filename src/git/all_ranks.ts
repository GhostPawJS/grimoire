import { execGit } from '../lib/exec_git.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function allRanks(ctx: GitContext): Record<string, number> {
	if (!isGitAvailable()) return {};
	try {
		const output = execGit(ctx, ['log', '--name-only', '--format=COMMIT:%H']);
		if (output === '') return {};

		const counts: Record<string, number> = {};
		let seen = new Set<string>();
		for (const line of output.split('\n')) {
			if (line.startsWith('COMMIT:')) {
				seen = new Set();
				continue;
			}
			if (line === '') continue;
			const parts = line.split('/');
			if (parts.length < 2) continue;
			const first = parts[0];
			if (first?.startsWith('.')) continue;
			const spellPath = `${first}/${parts[1]}`;
			if (!seen.has(spellPath)) counts[spellPath] = (counts[spellPath] ?? 0) + 1;
			seen.add(spellPath);
		}
		return counts;
	} catch {
		return {};
	}
}
