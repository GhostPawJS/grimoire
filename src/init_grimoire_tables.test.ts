import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { initGrimoireTables } from './init_grimoire_tables.ts';
import { openTestDatabase } from './lib/open-test-database.ts';

const EXPECTED_TABLES = [
	'spell_events',
	'spell_notes',
	'grimoire_health',
	'spell_drafts',
	'spell_provenance',
	'scout_index',
];

describe('initGrimoireTables', () => {
	it('creates all 6 entity tables', () => {
		const db = openTestDatabase();
		initGrimoireTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
			.all<{ name: string }>();
		const tableNames = tables.map((t) => t.name);

		for (const expected of EXPECTED_TABLES) {
			assert.ok(tableNames.includes(expected), `missing table: ${expected}`);
		}
		db.close();
	});

	it('creates the expected indexes', () => {
		const db = openTestDatabase();
		initGrimoireTables(db);

		const indexes = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name ASC",
			)
			.all<{ name: string }>();
		const indexNames = indexes.map((i) => i.name);

		assert.ok(indexNames.includes('idx_events_spell'));
		assert.ok(indexNames.includes('idx_events_ts'));
		assert.ok(indexNames.includes('idx_notes_status'));
		assert.ok(indexNames.includes('idx_drafts_status'));
		assert.ok(indexNames.includes('idx_scout_search'));
		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initGrimoireTables(db);
		initGrimoireTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
			.all<{ name: string }>();
		const tableNames = tables.map((t) => t.name);

		for (const expected of EXPECTED_TABLES) {
			assert.ok(tableNames.includes(expected), `missing table after double init: ${expected}`);
		}
		db.close();
	});
});
