export const DEFAULTS = {
	defaultChapter: 'general',
	noteCap: 50,
	noteExpiryDays: 90,
	staleDays: 90,
	dormantDays: 60,
	oversizeLines: 500,
	resonanceHalfLife: 30,
	routingThreshold: 0.3,
	clusteringThreshold: 0.4,
} as const;

export type GrimoireDefaults = typeof DEFAULTS;
