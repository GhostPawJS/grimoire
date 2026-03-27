import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SpellValidationResult, ValidationIssue, ValidationSeverity } from './types.ts';

describe('validation/types', () => {
	it('ValidationSeverity accepts valid values', () => {
		const values: ValidationSeverity[] = ['error', 'warning'];
		assert.equal(values.length, 2);
	});

	it('ValidationIssue is structurally valid', () => {
		const issue: ValidationIssue = {
			severity: 'error',
			code: 'missing-skill-md',
			message: 'SKILL.md not found',
		};
		assert.ok(issue !== undefined);
	});

	it('SpellValidationResult is structurally valid', () => {
		const result: SpellValidationResult = {
			path: 'chapter/spell',
			valid: true,
			issues: [],
		};
		assert.ok(result !== undefined);
	});
});
