import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { initEventTables } from './init_event_tables.ts';

describe('initEventTables', () => {
	it('creates the spell_events table and indexes', () => {
		const db = openTestDatabase();
		initEventTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_events'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		const indexes = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'spell_events' AND name IN ('idx_events_spell', 'idx_events_ts')",
			)
			.all<{ name: string }>();
		assert.equal(indexes.length, 2);
		const names = indexes.map((r) => r.name).sort();
		assert.deepEqual(names, ['idx_events_spell', 'idx_events_ts']);

		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initEventTables(db);
		initEventTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_events'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});
});
