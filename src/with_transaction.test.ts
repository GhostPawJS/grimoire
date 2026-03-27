import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from './lib/open-test-database.ts';
import { withTransaction } from './with_transaction.ts';

describe('withTransaction', () => {
	it('commits on success', () => {
		const db = openTestDatabase();
		db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY)');

		withTransaction(db, () => {
			db.exec('INSERT INTO t (id) VALUES (1)');
		});

		const row = db.prepare('SELECT id FROM t WHERE id = 1').get<{ id: number }>();
		assert.deepEqual(row, { id: 1 });
		db.close();
	});

	it('rolls back on error', () => {
		const db = openTestDatabase();
		db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY)');

		assert.throws(
			() => {
				withTransaction(db, () => {
					db.exec('INSERT INTO t (id) VALUES (1)');
					throw new Error('boom');
				});
			},
			{ message: 'boom' },
		);

		const rows = db.prepare('SELECT id FROM t').all<{ id: number }>();
		assert.equal(rows.length, 0);
		db.close();
	});

	it('supports nested transactions via savepoints', () => {
		const db = openTestDatabase();
		db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY)');

		withTransaction(db, () => {
			db.exec('INSERT INTO t (id) VALUES (1)');

			assert.throws(
				() => {
					withTransaction(db, () => {
						db.exec('INSERT INTO t (id) VALUES (2)');
						throw new Error('inner');
					});
				},
				{ message: 'inner' },
			);
		});

		const rows = db.prepare('SELECT id FROM t').all<{ id: number }>();
		assert.equal(rows.length, 1);
		assert.deepEqual(rows[0], { id: 1 });
		db.close();
	});
});
