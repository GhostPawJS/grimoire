import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveGrimoireDbPath(
	options: { flag?: string; env?: Record<string, string | undefined> } = {},
): string {
	return (
		options.flag ??
		((options.env ?? process.env).GHOSTPAW_GRIMOIRE_DB ||
			join(homedir(), '.ghostpaw', 'grimoire.db'))
	);
}
