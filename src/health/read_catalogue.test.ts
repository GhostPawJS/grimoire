import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { readCatalogue } from './read_catalogue.ts';

function baseJsonRow() {
	return {
		chapter_distribution: JSON.stringify({ a: 1 }),
		rank_distribution: JSON.stringify({ b: 2 }),
		stale_spells: JSON.stringify([] as string[]),
		dormant_spells: JSON.stringify([] as string[]),
		oversized_spells: JSON.stringify([] as string[]),
		orphan_clusters: JSON.stringify([]),
		chapter_balance: JSON.stringify({ c: 3 }),
		spell_health: JSON.stringify({ d: 4 }),
		seal_velocity: JSON.stringify({ e: 5 }),
	};
}

describe('readCatalogue', () => {
	it('returns undefined when no snapshots exist', () => {
		const db = createTestDb();
		assert.equal(readCatalogue(db), undefined);
		db.close();
	});

	it('returns the latest snapshot after inserting one', () => {
		const db = createTestDb();
		const j = baseJsonRow();
		db.prepare(
			`INSERT INTO grimoire_health (
				computed_at, total_spells, chapter_distribution, rank_distribution,
				stale_spells, dormant_spells, oversized_spells, pending_notes, notes_routed,
				orphan_clusters, drafts_queued, chapter_balance, spell_health, seal_velocity
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run(
			'2025-03-01T00:00:00.000Z',
			10,
			j.chapter_distribution,
			j.rank_distribution,
			j.stale_spells,
			j.dormant_spells,
			j.oversized_spells,
			1,
			2,
			j.orphan_clusters,
			0,
			j.chapter_balance,
			j.spell_health,
			j.seal_velocity,
		);

		const snap = readCatalogue(db);
		assert.ok(snap);
		assert.equal(snap.computedAt, '2025-03-01T00:00:00.000Z');
		assert.equal(snap.totalSpells, 10);
		assert.deepEqual(snap.chapterDistribution, { a: 1 });
		db.close();
	});

	it('returns the most recent snapshot when multiple exist', () => {
		const db = createTestDb();
		const j = baseJsonRow();
		const insert = db.prepare(
			`INSERT INTO grimoire_health (
				computed_at, total_spells, chapter_distribution, rank_distribution,
				stale_spells, dormant_spells, oversized_spells, pending_notes, notes_routed,
				orphan_clusters, drafts_queued, chapter_balance, spell_health, seal_velocity
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		);
		insert.run(
			'2025-03-01T00:00:00.000Z',
			1,
			j.chapter_distribution,
			j.rank_distribution,
			j.stale_spells,
			j.dormant_spells,
			j.oversized_spells,
			0,
			0,
			j.orphan_clusters,
			0,
			j.chapter_balance,
			j.spell_health,
			j.seal_velocity,
		);
		insert.run(
			'2025-03-27T00:00:00.000Z',
			99,
			JSON.stringify({ z: 9 }),
			j.rank_distribution,
			j.stale_spells,
			j.dormant_spells,
			j.oversized_spells,
			5,
			6,
			j.orphan_clusters,
			1,
			j.chapter_balance,
			j.spell_health,
			j.seal_velocity,
		);

		const snap = readCatalogue(db);
		assert.ok(snap);
		assert.equal(snap.computedAt, '2025-03-27T00:00:00.000Z');
		assert.equal(snap.totalSpells, 99);
		assert.deepEqual(snap.chapterDistribution, { z: 9 });
		assert.equal(snap.pendingNotes, 5);
		assert.equal(snap.notesRouted, 6);
		db.close();
	});
});
