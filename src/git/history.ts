import { execGit } from '../lib/exec_git.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext, HistoryEntry } from './types.ts';

export function history(ctx: GitContext, path?: string): HistoryEntry[] {
	if (path !== undefined) resolveSpellPath(ctx.root, path);
	if (!isGitAvailable()) return [];
	try {
		const output = execGit(ctx, ['log', '--name-only', '--format=COMMIT:%H|%s|%aI']);
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
					shortHash: rest.slice(0, 8),
					subject: rest.slice(firstPipe + 1, lastPipe),
					message: rest.slice(firstPipe + 1, lastPipe),
					date: rest.slice(lastPipe + 1),
					files: [],
				};
			} else if (line !== '' && current) {
				current.files.push(line);
			}
		}
		if (current) entries.push(current);

		if (!path) return entries;
		let currentPath = path;
		return entries.filter((entry) => {
			const move = /^move (\S+) -> (\S+)$/.exec(entry.message);
			if (move?.[2] === currentPath) {
				currentPath = move[1] as string;
				return true;
			}
			return entry.files.some((file) => file.startsWith(`${currentPath}/`));
		});
	} catch {
		return [];
	}
}
