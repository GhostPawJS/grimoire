import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	GrimoireError,
	GrimoireInvariantError,
	GrimoireNotFoundError,
	GrimoireStateError,
	GrimoireValidationError,
	isGrimoireError,
} from './errors.ts';

describe('GrimoireError', () => {
	it('carries a code and message', () => {
		const err = new GrimoireError('GRIMOIRE_VALIDATION', 'bad input');
		assert.equal(err.code, 'GRIMOIRE_VALIDATION');
		assert.equal(err.message, 'bad input');
		assert.equal(err.name, 'GrimoireError');
		assert.ok(err instanceof Error);
	});
});

describe('GrimoireNotFoundError', () => {
	it('extends GrimoireError with GRIMOIRE_NOT_FOUND code', () => {
		const err = new GrimoireNotFoundError('missing');
		assert.equal(err.code, 'GRIMOIRE_NOT_FOUND');
		assert.equal(err.name, 'GrimoireNotFoundError');
		assert.ok(err instanceof GrimoireError);
	});
});

describe('GrimoireValidationError', () => {
	it('extends GrimoireError with GRIMOIRE_VALIDATION code', () => {
		const err = new GrimoireValidationError('invalid');
		assert.equal(err.code, 'GRIMOIRE_VALIDATION');
		assert.equal(err.name, 'GrimoireValidationError');
		assert.ok(err instanceof GrimoireError);
	});
});

describe('GrimoireStateError', () => {
	it('extends GrimoireError with GRIMOIRE_STATE code', () => {
		const err = new GrimoireStateError('wrong state');
		assert.equal(err.code, 'GRIMOIRE_STATE');
		assert.equal(err.name, 'GrimoireStateError');
		assert.ok(err instanceof GrimoireError);
	});
});

describe('GrimoireInvariantError', () => {
	it('extends GrimoireError with GRIMOIRE_INVARIANT code', () => {
		const err = new GrimoireInvariantError('broken');
		assert.equal(err.code, 'GRIMOIRE_INVARIANT');
		assert.equal(err.name, 'GrimoireInvariantError');
		assert.ok(err instanceof GrimoireError);
	});
});

describe('isGrimoireError', () => {
	it('returns true for GrimoireError', () => {
		assert.equal(isGrimoireError(new GrimoireError('GRIMOIRE_VALIDATION', 'x')), true);
	});

	it('returns true for subtypes', () => {
		assert.equal(isGrimoireError(new GrimoireNotFoundError('x')), true);
		assert.equal(isGrimoireError(new GrimoireStateError('x')), true);
	});

	it('returns false for plain Error', () => {
		assert.equal(isGrimoireError(new Error('x')), false);
	});

	it('returns false for non-errors', () => {
		assert.equal(isGrimoireError('oops'), false);
		assert.equal(isGrimoireError(null), false);
	});
});
