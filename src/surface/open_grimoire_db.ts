import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { initGrimoireTables } from '../init_grimoire_tables.ts';
import { configureGrimoireDb } from './configure_grimoire_db.ts';

export async function openGrimoireDb(path: string): Promise<GrimoireDb> {
	const original = process.emitWarning;
	process.emitWarning = ((warning, ...args: unknown[]) => {
		const type =
			typeof args[0] === 'string'
				? args[0]
				: typeof args[0] === 'object' && args[0] !== null && 'type' in args[0]
					? args[0].type
					: warning instanceof Error
						? warning.name
						: undefined;
		const message = warning instanceof Error ? warning.message : warning;
		if (type === 'ExperimentalWarning' && message.startsWith('SQLite is an experimental feature'))
			return;
		Reflect.apply(original, process, [warning, ...args]);
	}) as typeof process.emitWarning;
	let sqlite: typeof import('node:sqlite');
	try {
		sqlite = await import('node:sqlite');
	} finally {
		process.emitWarning = original;
	}
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new sqlite.DatabaseSync(path);
	try {
		configureGrimoireDb(db as unknown as GrimoireDb, path !== ':memory:');
		const context = db as unknown as GrimoireDb;
		initGrimoireTables(context);
		return context;
	} catch (error) {
		db.close();
		throw error;
	}
}
