import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { initDraftTables } from './init_draft_tables.ts';

describe('initDraftTables', () => {
	it('creates the spell_drafts table and index', () => {
		const db = openTestDatabase();
		initDraftTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_drafts'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		const indexes = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'spell_drafts' AND name = 'idx_drafts_status'",
			)
			.all<{ name: string }>();
		assert.equal(indexes.length, 1);

		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initDraftTables(db);
		initDraftTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_drafts'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});
});
