import type { GrimoireDb } from '../database.ts';

export function initNoteTables(db: GrimoireDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS spell_notes (
			id            INTEGER PRIMARY KEY,
			source        TEXT    NOT NULL,
			source_id     TEXT,
			content       TEXT    NOT NULL,
			domain        TEXT,
			status        TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','distilled','expired')),
			distilled_by  TEXT,
			created_at    INTEGER NOT NULL
		)
	`);
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_notes_status ON spell_notes(status, domain)
	`);
}
