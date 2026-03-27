import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { refreshIndex } from './refresh_index.ts';

describe('refreshIndex', () => {
	it('is a function', () => {
		assert.equal(typeof refreshIndex, 'function');
	});
});
