import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapHealthRow } from './map_health_row.ts';
import type { CatalogueSnapshotRow } from './types.ts';

describe('mapHealthRow', () => {
	it('parses JSON columns into typed snapshot fields', () => {
		const row: CatalogueSnapshotRow = {
			id: 7,
			computed_at: '2025-03-27T12:00:00.000Z',
			total_spells: 42,
			chapter_distribution: JSON.stringify({ ember: 10, tide: 12, veil: 20 }),
			rank_distribution: JSON.stringify({ novice: 5, adept: 30, archon: 7 }),
			stale_spells: JSON.stringify(['/spells/a', '/spells/b']),
			dormant_spells: JSON.stringify(['/spells/c']),
			oversized_spells: JSON.stringify(['/spells/d']),
			pending_notes: 3,
			notes_routed: 100,
			orphan_clusters: JSON.stringify([
				{
					noteIds: [1, 2, 3],
					memberCount: 3,
					sourceCount: 2,
					suggestedTerms: ['bind', 'ward'],
				},
			]),
			drafts_queued: 2,
			chapter_balance: JSON.stringify({ ember: 0.25, tide: 0.3, veil: 0.45 }),
			spell_health: JSON.stringify({ mean: 0.88, p50: 0.9 }),
			seal_velocity: JSON.stringify({ last24h: 4, last7d: 18 }),
		};

		const mapped = mapHealthRow(row);

		assert.deepEqual(mapped.id, 7);
		assert.equal(mapped.computedAt, '2025-03-27T12:00:00.000Z');
		assert.equal(mapped.totalSpells, 42);
		assert.deepEqual(mapped.chapterDistribution, { ember: 10, tide: 12, veil: 20 });
		assert.deepEqual(mapped.rankDistribution, { novice: 5, adept: 30, archon: 7 });
		assert.deepEqual(mapped.staleSpells, ['/spells/a', '/spells/b']);
		assert.deepEqual(mapped.dormantSpells, ['/spells/c']);
		assert.deepEqual(mapped.oversizedSpells, ['/spells/d']);
		assert.equal(mapped.pendingNotes, 3);
		assert.equal(mapped.notesRouted, 100);
		assert.deepEqual(mapped.orphanClusters, [
			{
				noteIds: [1, 2, 3],
				memberCount: 3,
				sourceCount: 2,
				suggestedTerms: ['bind', 'ward'],
			},
		]);
		assert.equal(mapped.draftsQueued, 2);
		assert.deepEqual(mapped.chapterBalance, { ember: 0.25, tide: 0.3, veil: 0.45 });
		assert.deepEqual(mapped.spellHealth, { mean: 0.88, p50: 0.9 });
		assert.deepEqual(mapped.sealVelocity, { last24h: 4, last7d: 18 });
	});
});
