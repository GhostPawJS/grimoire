import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { tierInfo } from './tier_info.ts';

describe('tierInfo', () => {
	it('rank 0: Uncheckpointed, 1 seal to Apprentice', () => {
		const info = tierInfo(0);
		assert.equal(info.tier, 'Uncheckpointed');
		assert.equal(info.rank, 0);
		assert.equal(info.sealsToNextTier, 1);
	});

	it('rank 1: Apprentice, 2 seals to Journeyman', () => {
		const info = tierInfo(1);
		assert.equal(info.tier, 'Apprentice');
		assert.equal(info.rank, 1);
		assert.equal(info.sealsToNextTier, 2);
	});

	it('rank 2: Apprentice, 1 seal to Journeyman', () => {
		const info = tierInfo(2);
		assert.equal(info.tier, 'Apprentice');
		assert.equal(info.sealsToNextTier, 1);
	});

	it('rank 3: Journeyman, 3 seals to Expert', () => {
		const info = tierInfo(3);
		assert.equal(info.tier, 'Journeyman');
		assert.equal(info.sealsToNextTier, 3);
	});

	it('rank 5: Journeyman, 1 seal to Expert', () => {
		const info = tierInfo(5);
		assert.equal(info.tier, 'Journeyman');
		assert.equal(info.sealsToNextTier, 1);
	});

	it('rank 6: Expert, 4 seals to Master', () => {
		const info = tierInfo(6);
		assert.equal(info.tier, 'Expert');
		assert.equal(info.sealsToNextTier, 4);
	});

	it('rank 9: Expert, 1 seal to Master', () => {
		const info = tierInfo(9);
		assert.equal(info.tier, 'Expert');
		assert.equal(info.sealsToNextTier, 1);
	});

	it('rank 10: Master, 0 seals to next', () => {
		const info = tierInfo(10);
		assert.equal(info.tier, 'Master');
		assert.equal(info.sealsToNextTier, 0);
	});

	it('rank 50: Master, 0 seals to next', () => {
		const info = tierInfo(50);
		assert.equal(info.tier, 'Master');
		assert.equal(info.sealsToNextTier, 0);
	});
});
