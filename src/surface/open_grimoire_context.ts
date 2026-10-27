import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { init } from '../init.ts';
import { resolveGitDir } from '../lib/exec_git.ts';
import { openGrimoireDb } from './open_grimoire_db.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';
export async function openGrimoireContext(
	options: { db?: GrimoireDb; dbPath?: string; root?: string; gitDir?: string } = {},
) {
	const db =
		options.db ??
		(await openGrimoireDb(
			resolveGrimoireDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
		));
	const root = resolve(
		options.root ??
			(process.env.GHOSTPAW_GRIMOIRE_ROOT || join(homedir(), '.ghostpaw', 'grimoire')),
	);
	try {
		const gitDir = resolveGitDir(
			root,
			options.gitDir ?? (process.env.GHOSTPAW_GRIMOIRE_GIT_DIR || undefined),
		);
		init(root, db, { gitDir });
		return { root, db, gitDir };
	} catch (error) {
		if (!options.db) db.close();
		throw error;
	}
}
