import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { trigramJaccard, trigrams } from './trigram_jaccard.ts';

describe('trigrams', () => {
	it('produces character trigrams from a string', () => {
		const result = trigrams('hello');
		assert.deepEqual(result, new Set(['hel', 'ell', 'llo']));
	});

	it('normalizes to lowercase', () => {
		const result = trigrams('ABC');
		assert.deepEqual(result, new Set(['abc']));
	});

	it('returns empty set for empty string', () => {
		assert.equal(trigrams('').size, 0);
	});

	it('returns the short string itself for strings shorter than 3 chars', () => {
		assert.deepEqual(trigrams('ab'), new Set(['ab']));
		assert.deepEqual(trigrams('x'), new Set(['x']));
	});
});

describe('trigramJaccard', () => {
	it('returns 1 for identical strings', () => {
		assert.equal(trigramJaccard('deploy vercel', 'deploy vercel'), 1);
	});

	it('returns 0 for completely different strings', () => {
		assert.equal(trigramJaccard('abc', 'xyz'), 0);
	});

	it('returns 1 when both strings are empty', () => {
		assert.equal(trigramJaccard('', ''), 1);
	});

	it('returns 0 when one string is empty', () => {
		assert.equal(trigramJaccard('hello', ''), 0);
	});

	it('returns a value between 0 and 1 for partially similar strings', () => {
		const score = trigramJaccard('deploy vercel', 'deploy netlify');
		assert.ok(score > 0);
		assert.ok(score < 1);
	});

	it('is case insensitive', () => {
		assert.equal(trigramJaccard('Hello', 'hello'), 1);
	});
});
