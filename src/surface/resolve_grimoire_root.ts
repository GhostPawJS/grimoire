import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

/** Root selection shared by CLI help and CLI/MCP initialization. */
export function resolveGrimoireRoot(
	options: { root?: string; env?: Record<string, string | undefined> } = {},
): string {
	const env = options.env ?? process.env;
	const db = env.GHOSTPAW_GRIMOIRE_DB;
	return resolve(
		options.root ??
			(env.GHOSTPAW_GRIMOIRE_ROOT ||
				(db && db !== ':memory:'
					? join(dirname(resolve(db)), 'grimoire')
					: join(homedir(), '.ghostpaw', 'grimoire'))),
	);
}
