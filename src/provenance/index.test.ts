import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	allProvenance,
	deleteProvenance,
	getProvenance,
	initProvenanceTables,
	mapProvenanceRow,
	recordProvenance,
	updateProvenance,
} from './index.ts';

describe('provenance/index exports', () => {
	it('exports key functions', () => {
		assert.equal(typeof allProvenance, 'function');
		assert.equal(typeof deleteProvenance, 'function');
		assert.equal(typeof getProvenance, 'function');
		assert.equal(typeof initProvenanceTables, 'function');
		assert.equal(typeof mapProvenanceRow, 'function');
		assert.equal(typeof recordProvenance, 'function');
		assert.equal(typeof updateProvenance, 'function');
	});
});
