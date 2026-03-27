export type CatalogueSnapshotRow = {
	id: number;
	computed_at: string;
	total_spells: number;
	chapter_distribution: string;
	rank_distribution: string;
	stale_spells: string;
	dormant_spells: string;
	oversized_spells: string;
	pending_notes: number;
	notes_routed: number;
	orphan_clusters: string;
	drafts_queued: number;
	chapter_balance: string;
	spell_health: string;
	seal_velocity: string;
};

export interface OrphanCluster {
	noteIds: number[];
	memberCount: number;
	sourceCount: number;
	suggestedTerms: string[];
}

export interface CatalogueSnapshot {
	id: number;
	computedAt: string;
	totalSpells: number;
	chapterDistribution: Record<string, number>;
	rankDistribution: Record<string, number>;
	staleSpells: string[];
	dormantSpells: string[];
	oversizedSpells: string[];
	pendingNotes: number;
	notesRouted: number;
	orphanClusters: OrphanCluster[];
	draftsQueued: number;
	chapterBalance: Record<string, number>;
	spellHealth: Record<string, number>;
	sealVelocity: Record<string, number>;
}

export type SaveCatalogueInput = {
	computedAt: string;
	totalSpells: number;
	chapterDistribution: Record<string, number>;
	rankDistribution: Record<string, number>;
	staleSpells: string[];
	dormantSpells: string[];
	oversizedSpells: string[];
	pendingNotes: number;
	notesRouted: number;
	orphanClusters: OrphanCluster[];
	draftsQueued: number;
	chapterBalance: Record<string, number>;
	spellHealth: Record<string, number>;
	sealVelocity: Record<string, number>;
};
