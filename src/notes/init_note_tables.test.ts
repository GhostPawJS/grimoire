import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { initNoteTables } from './init_note_tables.ts';

describe('initNoteTables', () => {
	it('creates the spell_notes table and index', () => {
		const db = openTestDatabase();
		initNoteTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_notes'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		const indexes = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'spell_notes' AND name = 'idx_notes_status'",
			)
			.all<{ name: string }>();
		assert.equal(indexes.length, 1);
		assert.equal(indexes[0]?.name, 'idx_notes_status');

		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initNoteTables(db);
		initNoteTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_notes'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});
});
