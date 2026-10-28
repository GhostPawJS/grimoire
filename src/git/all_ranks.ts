import { execGit } from '../lib/exec_git.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext } from './types.ts';

export function allRanks(ctx: GitContext): Record<string, number> {
	if (!isGitAvailable()) return {};
	try {
		const output = execGit(ctx, ['log', '--name-status', '-M', '--format=COMMIT:%s%n%b%nFILES:']);
		const counts: Record<string, number> = {};
		const aliases = new Map<string, string>();
		const destination = (path: string): string => aliases.get(path) ?? path;
		for (const commit of output.split('COMMIT:').slice(1)) {
			const separator = commit.indexOf('FILES:');
			const message = commit.slice(0, separator);
			const seen = new Set<string>();
			for (const line of commit
				.slice(separator + 6)
				.trim()
				.split('\n')) {
				const [status, first, second] = line.split('\t');
				if (!first) continue;
				const spell = (file: string) => file.split('/').slice(0, 2).join('/');
				if (status?.startsWith('R') && second) {
					const target = destination(spell(second));
					aliases.set(spell(first), target);
					for (const [source, value] of aliases)
						if (value === spell(first)) aliases.set(source, target);
				}
				const path = destination(spell(second ?? first));
				if (!path.startsWith('.') && path.includes('/')) seen.add(path);
			}
			if (
				/Grimoire-Rollback:/m.test(message) ||
				/^move [A-Za-z0-9._-]+\/[A-Za-z0-9._-]+ -> [A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(?:\n|$)/.test(
					message,
				)
			)
				continue;
			for (const path of seen) counts[path] = (counts[path] ?? 0) + 1;
		}
		return counts;
	} catch {
		return {};
	}
}
