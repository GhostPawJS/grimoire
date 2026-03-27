import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkTierRequirements, validate, validateAll } from './index.ts';

describe('validation/index exports', () => {
	it('exports key functions', () => {
		assert.equal(typeof checkTierRequirements, 'function');
		assert.equal(typeof validate, 'function');
		assert.equal(typeof validateAll, 'function');
	});
});
