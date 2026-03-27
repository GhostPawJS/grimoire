import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { allResonance } from './all_resonance.ts';
import { logEvent } from './log_event.ts';

const DAY = 86_400_000;

describe('allResonance', () => {
	it('returns empty record when no events exist', () => {
		const db = createTestDb();
		const result = allResonance(db, { now: 1000 });
		assert.deepEqual(result, {});
		db.close();
	});

	it('returns resonance for multiple spells', () => {
		const db = createTestDb();
		const now = 5 * DAY;
		logEvent(db, { spell: 'alpha', event: 'read', now: 1 * DAY });
		logEvent(db, { spell: 'alpha', event: 'read', now: 2 * DAY });
		logEvent(db, { spell: 'beta', event: 'seal', now: 1 * DAY });
		logEvent(db, { spell: 'beta', event: 'read', now: 3 * DAY });

		const result = allResonance(db, { now });
		assert.ok('alpha' in result);
		assert.ok('beta' in result);
		assert.equal(result.alpha?.readCount, 2);
		assert.equal(result.beta?.readCount, 1);
		assert.equal(result.beta?.lastSealTs, 1 * DAY);
		db.close();
	});

	it('includes spells that only have non-read events', () => {
		const db = createTestDb();
		logEvent(db, { spell: 'gamma', event: 'seal', now: 100 });

		const result = allResonance(db, { now: 200 });
		assert.ok('gamma' in result);
		assert.equal(result.gamma?.readCount, 0);
		assert.equal(result.gamma?.color, 'grey');
		db.close();
	});
});
