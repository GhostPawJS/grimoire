import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeStaleness } from './compute_staleness.ts';

const MS_PER_DAY = 86_400_000;

describe('computeStaleness', () => {
	const now = Date.now();

	it('fresh spell: not stale, not dormant, low staleness', () => {
		const lastSealTs = now - 5 * MS_PER_DAY;
		const lastReadTs = now - 1 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, lastReadTs, now, 90, 60);
		assert.equal(result.isStale, false);
		assert.equal(result.isDormant, false);
		assert.ok(result.staleness < 0.1);
	});

	it('stale spell: sealed long ago but still being read', () => {
		const lastSealTs = now - 100 * MS_PER_DAY;
		const lastReadTs = now - 10 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, lastReadTs, now, 90, 60);
		assert.equal(result.isStale, true);
		assert.equal(result.isDormant, false);
		assert.ok(result.staleness >= 1);
	});

	it('dormant spell: never read', () => {
		const lastSealTs = now - 50 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, null, now, 90, 60);
		assert.equal(result.isStale, false);
		assert.equal(result.isDormant, true);
	});

	it('dormant spell: last read was long ago', () => {
		const lastSealTs = now - 100 * MS_PER_DAY;
		const lastReadTs = now - 70 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, lastReadTs, now, 90, 60);
		assert.equal(result.isDormant, true);
		assert.equal(result.isStale, false);
	});

	it('staleness is clamped to 1', () => {
		const lastSealTs = now - 200 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, null, now, 90, 60);
		assert.equal(result.staleness, 1);
	});

	it('staleness is 0 when just sealed', () => {
		const result = computeStaleness(now, now, now, 90, 60);
		assert.equal(result.staleness, 0);
		assert.equal(result.isStale, false);
		assert.equal(result.isDormant, false);
	});

	it('edge: exactly at staleDays threshold', () => {
		const lastSealTs = now - 90 * MS_PER_DAY;
		const lastReadTs = now - 1 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, lastReadTs, now, 90, 60);
		assert.equal(result.isStale, true);
		assert.equal(result.staleness, 1);
	});

	it('edge: exactly at dormantDays threshold', () => {
		const lastSealTs = now - 100 * MS_PER_DAY;
		const lastReadTs = now - 60 * MS_PER_DAY;
		const result = computeStaleness(lastSealTs, lastReadTs, now, 90, 60);
		assert.equal(result.isDormant, true);
		assert.equal(result.isStale, false);
	});
});
