import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GrimoireDb } from '../database.ts';
import { configureGrimoireDb } from './configure_grimoire_db.ts';

test('timeout precedes every other statement and WAL setup retries lock contention', () => {
	const calls: string[] = [];
	let locked = true;
	const db: GrimoireDb = {
		exec(sql) {
			calls.push(sql);
			if (sql.includes('journal_mode') && locked) {
				locked = false;
				throw new Error('database is locked');
			}
		},
		prepare() {
			throw new Error('unexpected prepare');
		},
		close() {},
	};
	configureGrimoireDb(db, true);
	assert.deepEqual(calls, [
		'PRAGMA busy_timeout=5000;',
		'PRAGMA journal_mode=WAL;',
		'PRAGMA journal_mode=WAL;',
	]);
	calls.length = 0;
	configureGrimoireDb(db, false);
	assert.deepEqual(calls, ['PRAGMA busy_timeout=5000;']);
	assert.throws(
		() =>
			configureGrimoireDb(
				{
					...db,
					exec(sql) {
						if (sql.includes('journal_mode')) throw new Error('disk error');
					},
				},
				true,
			),
		/disk error/,
	);
});
