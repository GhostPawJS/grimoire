import type { CatalogueSnapshot, CatalogueSnapshotRow } from './types.ts';

export function mapHealthRow(row: CatalogueSnapshotRow): CatalogueSnapshot {
	return {
		id: Number(row.id),
		computedAt: String(row.computed_at),
		totalSpells: Number(row.total_spells),
		chapterDistribution: JSON.parse(row.chapter_distribution) as Record<string, number>,
		rankDistribution: JSON.parse(row.rank_distribution) as Record<string, number>,
		staleSpells: JSON.parse(row.stale_spells) as string[],
		dormantSpells: JSON.parse(row.dormant_spells) as string[],
		oversizedSpells: JSON.parse(row.oversized_spells) as string[],
		pendingNotes: Number(row.pending_notes),
		notesRouted: Number(row.notes_routed),
		orphanClusters: JSON.parse(row.orphan_clusters) as CatalogueSnapshot['orphanClusters'],
		draftsQueued: Number(row.drafts_queued),
		chapterBalance: JSON.parse(row.chapter_balance) as Record<string, number>,
		spellHealth: JSON.parse(row.spell_health) as Record<string, number>,
		sealVelocity: JSON.parse(row.seal_velocity) as Record<string, number>,
	};
}
