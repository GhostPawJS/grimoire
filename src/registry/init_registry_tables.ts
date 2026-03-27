import type { GrimoireDb } from '../database.ts';

export function initRegistryTables(db: GrimoireDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS scout_index (
			id              INTEGER PRIMARY KEY,
			source          TEXT NOT NULL CHECK(source IN ('agentskillhub','github')),
			slug            TEXT NOT NULL,
			name            TEXT NOT NULL,
			description     TEXT,
			adoption_count  INTEGER,
			source_repo     TEXT,
			source_path     TEXT,
			fetch_url       TEXT,
			last_seen       TEXT NOT NULL,
			UNIQUE(source, slug)
		)
	`);
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_scout_search ON scout_index(name, description)
	`);
}
