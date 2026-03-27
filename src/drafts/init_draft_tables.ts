import type { GrimoireDb } from '../database.ts';

export function initDraftTables(db: GrimoireDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS spell_drafts (
			id         INTEGER PRIMARY KEY,
			title      TEXT    NOT NULL,
			rationale  TEXT    NOT NULL,
			note_ids   TEXT    NOT NULL,
			chapter    TEXT    NOT NULL,
			status     TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','dismissed')),
			created_at INTEGER NOT NULL
		)
	`);
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_drafts_status ON spell_drafts(status)
	`);
}
