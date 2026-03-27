import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireValidationError } from './errors.ts';
import { resolveNow } from './resolve_now.ts';

describe('resolveNow', () => {
	it('returns Date.now() when no argument given', () => {
		const before = Date.now();
		const result = resolveNow();
		const after = Date.now();
		assert.ok(result >= before && result <= after);
	});

	it('returns the given timestamp', () => {
		assert.equal(resolveNow(12345), 12345);
	});

	it('accepts zero', () => {
		assert.equal(resolveNow(0), 0);
	});

	it('throws on negative numbers', () => {
		assert.throws(() => resolveNow(-1), GrimoireValidationError);
	});

	it('throws on NaN', () => {
		assert.throws(() => resolveNow(Number.NaN), GrimoireValidationError);
	});

	it('throws on Infinity', () => {
		assert.throws(() => resolveNow(Number.POSITIVE_INFINITY), GrimoireValidationError);
	});
});
