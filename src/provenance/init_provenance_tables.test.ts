import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { initProvenanceTables } from './init_provenance_tables.ts';

describe('initProvenanceTables', () => {
	it('creates the spell_provenance table', () => {
		const db = openTestDatabase();
		initProvenanceTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_provenance'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initProvenanceTables(db);
		initProvenanceTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'spell_provenance'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});
});
