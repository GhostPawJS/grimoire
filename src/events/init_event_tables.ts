import type { GrimoireDb } from '../database.ts';

export function initEventTables(db: GrimoireDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS spell_events (
			id         INTEGER PRIMARY KEY,
			spell      TEXT    NOT NULL,
			event      TEXT    NOT NULL CHECK(event IN ('read','seal','inscribe','shelve','unshelve','move','hone','adopt')),
			context_id TEXT,
			ts         INTEGER NOT NULL
		)
	`);
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_events_spell ON spell_events(spell, event, id)
	`);
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_events_ts ON spell_events(ts)
	`);
}
