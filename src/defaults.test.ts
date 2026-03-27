import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULTS } from './defaults.ts';

describe('DEFAULTS', () => {
	it('exports an immutable object with all knobs', () => {
		assert.equal(typeof DEFAULTS, 'object');
		assert.equal(DEFAULTS.defaultChapter, 'general');
		assert.equal(DEFAULTS.noteCap, 50);
		assert.equal(DEFAULTS.noteExpiryDays, 90);
		assert.equal(DEFAULTS.staleDays, 90);
		assert.equal(DEFAULTS.dormantDays, 60);
		assert.equal(DEFAULTS.oversizeLines, 500);
		assert.equal(DEFAULTS.resonanceHalfLife, 30);
		assert.equal(DEFAULTS.routingThreshold, 0.3);
		assert.equal(DEFAULTS.clusteringThreshold, 0.4);
	});

	it('has exactly 9 keys', () => {
		assert.equal(Object.keys(DEFAULTS).length, 9);
	});
});
