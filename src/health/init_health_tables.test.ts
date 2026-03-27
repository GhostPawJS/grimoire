import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { initHealthTables } from './init_health_tables.ts';

describe('initHealthTables', () => {
	it('creates the grimoire_health table', () => {
		const db = openTestDatabase();
		initHealthTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'grimoire_health'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initHealthTables(db);
		initHealthTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'grimoire_health'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});
});
