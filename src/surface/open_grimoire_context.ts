import { homedir } from 'node:os';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { init } from '../init.ts';
import { openGrimoireDb } from './open_grimoire_db.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';
export async function openGrimoireContext(
	options: { db?: GrimoireDb; dbPath?: string; root?: string } = {},
) {
	const db =
		options.db ??
		(await openGrimoireDb(
			resolveGrimoireDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
		));
	const root =
		options.root ??
		(process.env.GHOSTPAW_GRIMOIRE_ROOT || join(homedir(), '.ghostpaw', 'grimoire'));
	try {
		init(root, db);
		return { root, db };
	} catch (error) {
		if (!options.db) db.close();
		throw error;
	}
}
