import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { tier } from './tier.ts';

describe('tier', () => {
	it('returns Uncheckpointed for rank 0', () => {
		assert.equal(tier(0), 'Uncheckpointed');
	});

	it('returns Uncheckpointed for negative rank', () => {
		assert.equal(tier(-1), 'Uncheckpointed');
	});

	it('returns Apprentice for rank 1', () => {
		assert.equal(tier(1), 'Apprentice');
	});

	it('returns Apprentice for rank 2', () => {
		assert.equal(tier(2), 'Apprentice');
	});

	it('returns Journeyman for rank 3', () => {
		assert.equal(tier(3), 'Journeyman');
	});

	it('returns Journeyman for rank 5', () => {
		assert.equal(tier(5), 'Journeyman');
	});

	it('returns Expert for rank 6', () => {
		assert.equal(tier(6), 'Expert');
	});

	it('returns Expert for rank 9', () => {
		assert.equal(tier(9), 'Expert');
	});

	it('returns Master for rank 10', () => {
		assert.equal(tier(10), 'Master');
	});

	it('returns Master for rank 100', () => {
		assert.equal(tier(100), 'Master');
	});
});
