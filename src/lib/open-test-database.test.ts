import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from './open-test-database.ts';

describe('openTestDatabase', () => {
	it('returns a functional in-memory database', () => {
		const db = openTestDatabase();
		db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
		db.exec('INSERT INTO test (id) VALUES (1)');
		const row = db.prepare('SELECT id FROM test').get<{ id: number }>();
		assert.deepEqual(row, { id: 1 });
		db.close();
	});

	it('has foreign keys enabled', () => {
		const db = openTestDatabase();
		const row = db.prepare('PRAGMA foreign_keys').get<{ foreign_keys: number }>();
		assert.equal(row?.foreign_keys, 1);
		db.close();
	});

	it('supports prepare().all()', () => {
		const db = openTestDatabase();
		db.exec('CREATE TABLE nums (n INTEGER)');
		db.exec('INSERT INTO nums VALUES (1)');
		db.exec('INSERT INTO nums VALUES (2)');
		const rows = db.prepare('SELECT n FROM nums ORDER BY n').all<{ n: number }>();
		assert.deepEqual(rows, [{ n: 1 }, { n: 2 }]);
		db.close();
	});

	it('supports prepare().run()', () => {
		const db = openTestDatabase();
		db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, val TEXT)');
		const result = db.prepare("INSERT INTO items (val) VALUES ('hello')").run();
		assert.ok(
			typeof result.lastInsertRowid === 'number' || typeof result.lastInsertRowid === 'bigint',
		);
		db.close();
	});
});
