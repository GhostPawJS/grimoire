import { resolve } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { init } from '../init.ts';
import { resolveGitDir } from '../lib/exec_git.ts';
import { openGrimoireDb } from './open_grimoire_db.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';
import { resolveGrimoireRoot } from './resolve_grimoire_root.ts';
export async function openGrimoireContext(
	options: {
		db?: GrimoireDb;
		dbPath?: string;
		root?: string;
		gitDir?: string;
		readOnly?: boolean;
	} = {},
) {
	const db =
		options.db ??
		(await openGrimoireDb(
			resolveGrimoireDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
			options.readOnly,
		));
	const root = resolveGrimoireRoot(options);
	try {
		const configuredGitDir = options.gitDir ?? (process.env.GHOSTPAW_GRIMOIRE_GIT_DIR || undefined);
		if (options.readOnly)
			return {
				root,
				db,
				gitDir: resolve(configuredGitDir ?? resolve(root, '.grimoire-git')),
				gitDirExplicit: configuredGitDir !== undefined,
			};
		const gitDir = resolveGitDir(root, configuredGitDir);
		init(root, db, { gitDir });
		return { root, db, gitDir, gitDirExplicit: configuredGitDir !== undefined };
	} catch (error) {
		if (!options.db) db.close();
		throw error;
	}
}
