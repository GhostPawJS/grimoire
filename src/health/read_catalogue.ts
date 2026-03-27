import type { GrimoireDb } from '../database.ts';
import { mapHealthRow } from './map_health_row.ts';
import type { CatalogueSnapshot, CatalogueSnapshotRow } from './types.ts';

export function readCatalogue(db: GrimoireDb): CatalogueSnapshot | undefined {
	const row = db
		.prepare(
			'SELECT id, computed_at, total_spells, chapter_distribution, rank_distribution, ' +
				'stale_spells, dormant_spells, oversized_spells, pending_notes, notes_routed, ' +
				'orphan_clusters, drafts_queued, chapter_balance, spell_health, seal_velocity ' +
				'FROM grimoire_health ORDER BY id DESC LIMIT 1',
		)
		.get<CatalogueSnapshotRow>();
	return row ? mapHealthRow(row) : undefined;
}
