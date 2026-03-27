import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { logEvent } from './log_event.ts';
import { resonance } from './resonance.ts';

const DAY = 86_400_000;

describe('resonance', () => {
	it('returns grey with zero reads when no events exist', () => {
		const db = createTestDb();
		const r = resonance(db, 'unknown/spell', { now: 1000 });
		assert.equal(r.color, 'grey');
		assert.equal(r.weightedReads, 0);
		assert.equal(r.readCount, 0);
		assert.equal(r.lastSealTs, null);
		db.close();
	});

	it('accumulates reads without a seal', () => {
		const db = createTestDb();
		const now = 10 * DAY;
		logEvent(db, { spell: 'a', event: 'read', now: now - 1 * DAY });
		logEvent(db, { spell: 'a', event: 'read', now: now - 1 * DAY });
		logEvent(db, { spell: 'a', event: 'read', now: now - 1 * DAY });
		const r = resonance(db, 'a', { now });
		assert.equal(r.readCount, 3);
		assert.ok(r.weightedReads > 0);
		assert.equal(r.lastSealTs, null);
		db.close();
	});

	it('resets reads after a seal', () => {
		const db = createTestDb();
		const now = 20 * DAY;
		logEvent(db, { spell: 'b', event: 'read', now: 1 * DAY });
		logEvent(db, { spell: 'b', event: 'read', now: 2 * DAY });
		logEvent(db, { spell: 'b', event: 'seal', now: 5 * DAY });
		logEvent(db, { spell: 'b', event: 'read', now: 6 * DAY });
		const r = resonance(db, 'b', { now });
		assert.equal(r.readCount, 1);
		assert.equal(r.lastSealTs, 5 * DAY);
		db.close();
	});

	it('decays weight over time', () => {
		const db = createTestDb();
		const now = 100 * DAY;
		logEvent(db, { spell: 'c', event: 'read', now: 1 * DAY });
		const old = resonance(db, 'c', { now });

		const db2 = createTestDb();
		logEvent(db2, { spell: 'c', event: 'read', now: now - 1 * DAY });
		const recent = resonance(db2, 'c', { now });

		assert.ok(recent.weightedReads > old.weightedReads);
		db.close();
		db2.close();
	});

	it('returns green at the 1.0 boundary', () => {
		const db = createTestDb();
		const now = 1 * DAY;
		logEvent(db, { spell: 'd', event: 'read', now: 0 });
		const r = resonance(db, 'd', { now, resonanceHalfLife: 30 });
		assert.ok(r.weightedReads >= 0.9);
		assert.equal(r.color, r.weightedReads >= 1.0 ? 'green' : 'grey');
		db.close();
	});

	it('returns yellow when weighted reads reach 3.0', () => {
		const db = createTestDb();
		const now = 0;
		for (let i = 0; i < 4; i++) {
			logEvent(db, { spell: 'e', event: 'read', now: 0 });
		}
		const r = resonance(db, 'e', { now });
		assert.ok(r.weightedReads >= 3.0);
		assert.ok(r.color === 'yellow' || r.color === 'orange');
		db.close();
	});

	it('returns orange when weighted reads reach 6.0', () => {
		const db = createTestDb();
		const now = 0;
		for (let i = 0; i < 7; i++) {
			logEvent(db, { spell: 'f', event: 'read', now: 0 });
		}
		const r = resonance(db, 'f', { now });
		assert.ok(r.weightedReads >= 6.0);
		assert.equal(r.color, 'orange');
		db.close();
	});

	it('respects custom resonanceHalfLife', () => {
		const db = createTestDb();
		const now = 10 * DAY;
		logEvent(db, { spell: 'g', event: 'read', now: 0 });
		const short = resonance(db, 'g', { now, resonanceHalfLife: 1 });
		const long = resonance(db, 'g', { now, resonanceHalfLife: 1000 });
		assert.ok(long.weightedReads > short.weightedReads);
		db.close();
	});
});
