import { execGit } from '../lib/exec_git.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext, HistoryEntry } from './types.ts';

export function history(ctx: GitContext, path?: string): HistoryEntry[] {
	if (!isGitAvailable()) return [];
	try {
		const scope = path ? `-- "${path}/"` : '';
		const output = execGit(ctx, `log --name-only --format="COMMIT:%H|%s|%aI" ${scope}`);
		if (output === '') return [];

		const entries: HistoryEntry[] = [];
		let current: HistoryEntry | undefined;

		for (const line of output.split('\n')) {
			if (line.startsWith('COMMIT:')) {
				if (current) entries.push(current);
				const rest = line.slice(7);
				const firstPipe = rest.indexOf('|');
				const lastPipe = rest.lastIndexOf('|');
				current = {
					hash: rest.slice(0, firstPipe),
					message: rest.slice(firstPipe + 1, lastPipe),
					date: rest.slice(lastPipe + 1),
					files: [],
				};
			} else if (line !== '' && current) {
				current.files.push(line);
			}
		}
		if (current) entries.push(current);

		return entries;
	} catch {
		return [];
	}
}
