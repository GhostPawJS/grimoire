import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { initRegistryTables } from './init_registry_tables.ts';

describe('initRegistryTables', () => {
	it('creates the scout_index table and index', () => {
		const db = openTestDatabase();
		initRegistryTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'scout_index'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		const indexes = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'scout_index' AND name = 'idx_scout_search'",
			)
			.all<{ name: string }>();
		assert.equal(indexes.length, 1);
		assert.equal(indexes[0]?.name, 'idx_scout_search');

		db.close();
	});

	it('enforces UNIQUE(source, slug)', () => {
		const db = openTestDatabase();
		initRegistryTables(db);

		db.prepare(
			`INSERT INTO scout_index (source, slug, name, description, adoption_count, source_repo, source_path, fetch_url, last_seen)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run('github', 'dup', 'First', null, null, null, null, null, '2025-01-01T00:00:00.000Z');

		assert.throws(() => {
			db.prepare(
				`INSERT INTO scout_index (source, slug, name, description, adoption_count, source_repo, source_path, fetch_url, last_seen)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			).run('github', 'dup', 'Second', null, null, null, null, null, '2025-01-01T00:00:00.000Z');
		});

		db.close();
	});

	it('is idempotent', () => {
		const db = openTestDatabase();
		initRegistryTables(db);
		initRegistryTables(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'scout_index'")
			.all<{ name: string }>();
		assert.equal(tables.length, 1);

		db.close();
	});
});
