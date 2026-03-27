import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as registry from './index.ts';

describe('registry index exports', () => {
	it('exports core functions', () => {
		assert.equal(typeof registry.initRegistryTables, 'function');
		assert.equal(typeof registry.mapRegistryRow, 'function');
		assert.equal(typeof registry.searchIndex, 'function');
		assert.equal(typeof registry.upsertIndexEntry, 'function');
	});

	it('exports network functions', () => {
		assert.equal(typeof registry.analyzeRepo, 'function');
		assert.equal(typeof registry.refreshIndex, 'function');
		assert.equal(typeof registry.searchSkills, 'function');
	});
});
