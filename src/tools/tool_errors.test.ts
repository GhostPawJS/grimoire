import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError, GrimoireStateError, GrimoireValidationError } from '../errors.ts';
import { translateToolError, withToolHandling } from './tool_errors.ts';

describe('translateToolError', () => {
	it('translates GrimoireNotFoundError to not_found', () => {
		const result = translateToolError(new GrimoireNotFoundError('Spell missing'));
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		assert.equal(result.error.kind, 'domain');
		assert.equal(result.error.code, 'not_found');
		assert.equal(result.error.message, 'Spell missing');
		assert.ok(result.error.recovery);
		assert.ok(result.next && result.next.length > 0);
	});

	it('translates GrimoireValidationError to validation_failed', () => {
		const result = translateToolError(new GrimoireValidationError('Bad input'));
		assert.equal(result.error.kind, 'protocol');
		assert.equal(result.error.code, 'validation_failed');
		assert.equal(result.error.recovery, 'Fix the invalid input fields and retry.');
	});

	it('translates GrimoireStateError to invalid_state', () => {
		const result = translateToolError(new GrimoireStateError('Wrong state'));
		assert.equal(result.error.kind, 'domain');
		assert.equal(result.error.code, 'invalid_state');
	});

	it('translates unknown Error to system_error', () => {
		const result = translateToolError(new Error('boom'));
		assert.equal(result.error.kind, 'system');
		assert.equal(result.error.code, 'system_error');
		assert.equal(result.error.message, 'boom');
	});

	it('translates non-Error to system_error', () => {
		const result = translateToolError('oops');
		assert.equal(result.error.kind, 'system');
		assert.equal(result.error.code, 'system_error');
		assert.equal(result.error.message, 'oops');
	});

	it('uses custom summary when provided', () => {
		const result = translateToolError(new Error('x'), { summary: 'Custom.' });
		assert.equal(result.summary, 'Custom.');
	});
});

describe('withToolHandling', () => {
	it('returns function result on success', () => {
		const wrapped = withToolHandling((x: number) => x * 2);
		assert.equal(wrapped(5), 10);
	});

	it('catches and translates errors', () => {
		const wrapped = withToolHandling(() => {
			throw new GrimoireNotFoundError('gone');
		});
		const result = wrapped();
		assert.equal(typeof result, 'object');
		assert.equal((result as { ok: boolean }).ok, false);
	});
});
