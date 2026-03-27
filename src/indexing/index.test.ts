import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as indexing from './index.ts';

describe('indexing index exports', () => {
	it('exports core functions', () => {
		assert.equal(typeof indexing.buildIndex, 'function');
		assert.equal(typeof indexing.formatIndex, 'function');
	});
});
