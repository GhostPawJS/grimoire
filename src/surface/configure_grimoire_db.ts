import type { GrimoireDb } from '../database.ts';

export function configureGrimoireDb(db: GrimoireDb, file: boolean): void {
	db.exec('PRAGMA busy_timeout=5000;');
	if (!file) return;
	const deadline = Date.now() + 5000;
	const sleeper = new Int32Array(new SharedArrayBuffer(4));
	for (;;) {
		try {
			db.exec('PRAGMA journal_mode=WAL;');
			return;
		} catch (error) {
			if (!/database is (?:locked|busy)/i.test(String(error)) || Date.now() >= deadline)
				throw error;
			Atomics.wait(sleeper, 0, 0, 25);
		}
	}
}
