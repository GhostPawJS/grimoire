import type { OrphanCluster } from '../health/types.ts';

export type CatalogueOptions = {
	staleDays?: number;
	dormantDays?: number;
	oversizeLines?: number;
	routingThreshold?: number;
	clusteringThreshold?: number;
	resonanceHalfLife?: number;
	now?: number;
};

export type SpellHealth = {
	path: string;
	staleness: number;
	oversizeRatio: number;
	resonanceWeight: number;
	health: number;
	sealVelocity: number;
	isStale: boolean;
	isDormant: boolean;
	isOversized: boolean;
};

export type ChapterBalance = {
	chapter: string;
	spellCount: number;
	pendingNotes: number;
	noteLoadRatio: number;
};

export type { OrphanCluster };
