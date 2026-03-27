import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { readCatalogue } from './read_catalogue.ts';
import { saveCatalogue } from './save_catalogue.ts';
import type { SaveCatalogueInput } from './types.ts';

function baseInput(): SaveCatalogueInput {
	return {
		computedAt: '2026-03-27T12:00:00.000Z',
		totalSpells: 42,
		chapterDistribution: { basics: 10, advanced: 32 },
		rankDistribution: { novice: 5, adept: 37 },
		staleSpells: ['old/spell'],
		dormantSpells: ['sleepy/spell'],
		oversizedSpells: [],
		pendingNotes: 3,
		notesRouted: 7,
		orphanClusters: [{ noteIds: [1, 2], memberCount: 2, sourceCount: 1, suggestedTerms: ['term'] }],
		draftsQueued: 1,
		chapterBalance: { basics: 0.5, advanced: 1.5 },
		spellHealth: { 'basics/hello': 0.9 },
		sealVelocity: { week1: 3 },
	};
}

describe('saveCatalogue', () => {
	it('returns an id', () => {
		const db = createTestDb();
		const { id } = saveCatalogue(db, baseInput());
		assert.ok(id > 0);
		db.close();
	});

	it('round-trips through readCatalogue', () => {
		const db = createTestDb();
		const input = baseInput();
		saveCatalogue(db, input);

		const snap = readCatalogue(db);
		assert.ok(snap);
		assert.equal(snap.computedAt, input.computedAt);
		assert.equal(snap.totalSpells, input.totalSpells);
		assert.deepEqual(snap.chapterDistribution, input.chapterDistribution);
		assert.deepEqual(snap.rankDistribution, input.rankDistribution);
		assert.deepEqual(snap.staleSpells, input.staleSpells);
		assert.deepEqual(snap.dormantSpells, input.dormantSpells);
		assert.deepEqual(snap.oversizedSpells, input.oversizedSpells);
		assert.equal(snap.pendingNotes, input.pendingNotes);
		assert.equal(snap.notesRouted, input.notesRouted);
		assert.deepEqual(snap.orphanClusters, input.orphanClusters);
		assert.equal(snap.draftsQueued, input.draftsQueued);
		assert.deepEqual(snap.chapterBalance, input.chapterBalance);
		assert.deepEqual(snap.spellHealth, input.spellHealth);
		assert.deepEqual(snap.sealVelocity, input.sealVelocity);
		db.close();
	});

	it('latest insert wins in readCatalogue', () => {
		const db = createTestDb();
		const first = baseInput();
		first.totalSpells = 10;
		saveCatalogue(db, first);

		const second = baseInput();
		second.totalSpells = 99;
		second.computedAt = '2026-03-28T00:00:00.000Z';
		saveCatalogue(db, second);

		const snap = readCatalogue(db);
		assert.ok(snap);
		assert.equal(snap.totalSpells, 99);
		assert.equal(snap.computedAt, '2026-03-28T00:00:00.000Z');
		db.close();
	});
});
