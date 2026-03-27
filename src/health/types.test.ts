import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CatalogueSnapshot, CatalogueSnapshotRow, OrphanCluster } from './types.ts';

describe('types', () => {
	it('module can be imported', () => {
		const _row: CatalogueSnapshotRow = {
			id: 1,
			computed_at: 't',
			total_spells: 0,
			chapter_distribution: '{}',
			rank_distribution: '{}',
			stale_spells: '[]',
			dormant_spells: '[]',
			oversized_spells: '[]',
			pending_notes: 0,
			notes_routed: 0,
			orphan_clusters: '[]',
			drafts_queued: 0,
			chapter_balance: '{}',
			spell_health: '{}',
			seal_velocity: '{}',
		};
		const _cluster: OrphanCluster = {
			noteIds: [],
			memberCount: 0,
			sourceCount: 0,
			suggestedTerms: [],
		};
		const _snap: CatalogueSnapshot = {
			id: 1,
			computedAt: 't',
			totalSpells: 0,
			chapterDistribution: {},
			rankDistribution: {},
			staleSpells: [],
			dormantSpells: [],
			oversizedSpells: [],
			pendingNotes: 0,
			notesRouted: 0,
			orphanClusters: [],
			draftsQueued: 0,
			chapterBalance: {},
			spellHealth: {},
			sealVelocity: {},
		};
		assert.ok(_row && _cluster && _snap);
	});
});
