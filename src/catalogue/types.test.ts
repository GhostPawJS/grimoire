import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CatalogueOptions, ChapterBalance, OrphanCluster, SpellHealth } from './types.ts';

describe('catalogue/types', () => {
	it('CatalogueOptions is assignable with all optional fields', () => {
		const opts: CatalogueOptions = {};
		assert.ok(opts);
	});

	it('CatalogueOptions accepts all known fields', () => {
		const opts: CatalogueOptions = {
			staleDays: 90,
			dormantDays: 60,
			oversizeLines: 500,
			routingThreshold: 0.3,
			clusteringThreshold: 0.4,
			resonanceHalfLife: 30,
			now: Date.now(),
		};
		assert.equal(opts.staleDays, 90);
	});

	it('SpellHealth has all required fields', () => {
		const h: SpellHealth = {
			path: 'basics/hello',
			staleness: 0.5,
			oversizeRatio: 0,
			resonanceWeight: 0.8,
			health: 0.4,
			sealVelocity: 2,
			isStale: true,
			isDormant: false,
			isOversized: false,
		};
		assert.equal(h.path, 'basics/hello');
	});

	it('ChapterBalance has all required fields', () => {
		const b: ChapterBalance = {
			chapter: 'basics',
			spellCount: 5,
			pendingNotes: 3,
			noteLoadRatio: 0.6,
		};
		assert.equal(b.chapter, 'basics');
	});

	it('OrphanCluster re-export matches health/types shape', () => {
		const c: OrphanCluster = {
			noteIds: [1, 2],
			memberCount: 2,
			sourceCount: 1,
			suggestedTerms: ['term'],
		};
		assert.deepEqual(c.noteIds, [1, 2]);
	});
});
