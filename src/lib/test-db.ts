import type { GrimoireDb } from '../database.ts';
import { initGrimoireTables } from '../init_grimoire_tables.ts';
import { openTestDatabase } from './open-test-database.ts';

export function createTestDb(): GrimoireDb {
	const db = openTestDatabase();
	initGrimoireTables(db);
	return db;
}
