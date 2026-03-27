import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { initHealthTables, mapHealthRow, readCatalogue } from './index.ts';

describe('health/index exports', () => {
	it('exports key functions', () => {
		assert.equal(typeof initHealthTables, 'function');
		assert.equal(typeof mapHealthRow, 'function');
		assert.equal(typeof readCatalogue, 'function');
	});
});
