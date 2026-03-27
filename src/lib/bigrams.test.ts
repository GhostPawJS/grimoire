import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bigrams, topBigrams } from './bigrams.ts';

describe('bigrams', () => {
	it('returns word-pair bigrams', () => {
		assert.deepEqual(bigrams('deploy to vercel'), ['deploy to', 'to vercel']);
	});

	it('returns empty for single word', () => {
		assert.deepEqual(bigrams('deploy'), []);
	});

	it('returns empty for empty string', () => {
		assert.deepEqual(bigrams(''), []);
	});

	it('normalizes to lowercase', () => {
		assert.deepEqual(bigrams('Deploy To Vercel'), ['deploy to', 'to vercel']);
	});

	it('collapses whitespace', () => {
		assert.deepEqual(bigrams('deploy  to   vercel'), ['deploy to', 'to vercel']);
	});
});

describe('topBigrams', () => {
	it('returns most frequent bigrams across texts', () => {
		const texts = [
			'deploy to vercel quickly',
			'deploy to production safely',
			'deploy to vercel with rollback',
		];
		const top = topBigrams(texts, 2);
		assert.equal(top[0], 'deploy to');
		assert.equal(top.length, 2);
	});

	it('returns empty for single-word texts', () => {
		assert.deepEqual(topBigrams(['hello', 'world']), []);
	});

	it('respects limit', () => {
		const texts = ['a b c d e f g'];
		assert.equal(topBigrams(texts, 3).length, 3);
	});
});
