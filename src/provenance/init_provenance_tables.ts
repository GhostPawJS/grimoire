import type { GrimoireDb } from '../database.ts';

export function initProvenanceTables(db: GrimoireDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS spell_provenance (
			spell_path     TEXT PRIMARY KEY,
			source_type    TEXT NOT NULL CHECK(source_type IN ('agentskillhub','github','local')),
			source_url     TEXT,
			source_repo    TEXT,
			source_path    TEXT,
			source_commit  TEXT,
			source_version TEXT,
			imported_at    TEXT NOT NULL,
			updated_at     TEXT
		)
	`);
}
