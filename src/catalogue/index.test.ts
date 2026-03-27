import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	catalogue,
	clusterOrphans,
	computeChapterBalance,
	computeSealVelocity,
	computeSpellHealth,
	computeStaleness,
	routeNotes,
} from './index.ts';

describe('catalogue/index exports', () => {
	it('exports all public functions', () => {
		assert.equal(typeof catalogue, 'function');
		assert.equal(typeof clusterOrphans, 'function');
		assert.equal(typeof computeChapterBalance, 'function');
		assert.equal(typeof computeSealVelocity, 'function');
		assert.equal(typeof computeSpellHealth, 'function');
		assert.equal(typeof computeStaleness, 'function');
		assert.equal(typeof routeNotes, 'function');
	});
});
