import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeRepo } from './analyze_repo.ts';

describe('analyzeRepo', () => {
	it('is a function', () => {
		assert.equal(typeof analyzeRepo, 'function');
	});

	it('rejects empty URL', async () => {
		await assert.rejects(() => analyzeRepo(''), {
			message: 'analyzeRepo requires a non-empty URL',
		});
	});

	it('rejects whitespace-only URL', async () => {
		await assert.rejects(() => analyzeRepo('   '), {
			message: 'analyzeRepo requires a non-empty URL',
		});
	});
});
