import type { GrimoireDb } from '../database.ts';
import type { SaveCatalogueInput } from './types.ts';

export function saveCatalogue(db: GrimoireDb, input: SaveCatalogueInput): { id: number } {
	const result = db
		.prepare(
			`INSERT INTO grimoire_health (
				computed_at, total_spells, chapter_distribution, rank_distribution,
				stale_spells, dormant_spells, oversized_spells, pending_notes, notes_routed,
				orphan_clusters, drafts_queued, chapter_balance, spell_health, seal_velocity
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			input.computedAt,
			input.totalSpells,
			JSON.stringify(input.chapterDistribution),
			JSON.stringify(input.rankDistribution),
			JSON.stringify(input.staleSpells),
			JSON.stringify(input.dormantSpells),
			JSON.stringify(input.oversizedSpells),
			input.pendingNotes,
			input.notesRouted,
			JSON.stringify(input.orphanClusters),
			input.draftsQueued,
			JSON.stringify(input.chapterBalance),
			JSON.stringify(input.spellHealth),
			JSON.stringify(input.sealVelocity),
		);
	return { id: Number(result.lastInsertRowid) };
}
