import type { GrimoireDb } from '../database.ts';

export function initHealthTables(db: GrimoireDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS grimoire_health (
			id                    INTEGER PRIMARY KEY,
			computed_at           TEXT    NOT NULL,
			total_spells          INTEGER NOT NULL,
			chapter_distribution  TEXT    NOT NULL,
			rank_distribution     TEXT    NOT NULL,
			stale_spells          TEXT    NOT NULL,
			dormant_spells        TEXT    NOT NULL,
			oversized_spells      TEXT    NOT NULL,
			pending_notes         INTEGER NOT NULL,
			notes_routed          INTEGER NOT NULL,
			orphan_clusters       TEXT    NOT NULL,
			drafts_queued         INTEGER NOT NULL,
			chapter_balance       TEXT    NOT NULL,
			spell_health          TEXT    NOT NULL,
			seal_velocity         TEXT    NOT NULL
		)
	`);
}
