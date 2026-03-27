import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeSpellHealth } from './compute_spell_health.ts';

describe('computeSpellHealth', () => {
	it('perfect health: no staleness, no oversize, full resonance', () => {
		assert.equal(computeSpellHealth(0, 0, 1), 1);
	});

	it('zero health when fully stale', () => {
		assert.equal(computeSpellHealth(1, 0, 1), 0);
	});

	it('zero health when fully oversized', () => {
		assert.equal(computeSpellHealth(0, 1, 1), 0);
	});

	it('zero health when no resonance', () => {
		assert.equal(computeSpellHealth(0, 0, 0), 0);
	});

	it('mixed values', () => {
		const result = computeSpellHealth(0.5, 0.5, 0.8);
		assert.ok(result > 0);
		assert.ok(result < 1);
		const expected = 0.5 * 0.5 * 0.8;
		assert.ok(Math.abs(result - expected) < 1e-10);
	});

	it('clamps below 0', () => {
		assert.equal(computeSpellHealth(1.5, 0, 1), 0);
	});

	it('clamps above 1', () => {
		assert.equal(computeSpellHealth(-1, 0, 1), 1);
	});
});
