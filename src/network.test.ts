import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as network from './network.ts';

describe('network barrel', () => {
	it('exports fetchSkills', () => {
		assert.equal(typeof network.fetchSkills, 'function');
	});

	it('exports scout', () => {
		assert.equal(typeof network.scout, 'function');
	});

	it('exports checkUpdates', () => {
		assert.equal(typeof network.checkUpdates, 'function');
	});

	it('exports applyUpdate', () => {
		assert.equal(typeof network.applyUpdate, 'function');
	});

	it('exports searchSkills', () => {
		assert.equal(typeof network.searchSkills, 'function');
	});

	it('exports analyzeRepo', () => {
		assert.equal(typeof network.analyzeRepo, 'function');
	});

	it('exports refreshIndex', () => {
		assert.equal(typeof network.refreshIndex, 'function');
	});
});
