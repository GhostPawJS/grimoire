import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { searchSkills } from './search_skills.ts';

describe('searchSkills', () => {
	it('is a function', () => {
		assert.equal(typeof searchSkills, 'function');
	});

	it('returns empty array for empty query', async () => {
		const results = await searchSkills('');
		assert.deepEqual(results, []);
	});

	it('returns empty array for whitespace-only query', async () => {
		const results = await searchSkills('   ');
		assert.deepEqual(results, []);
	});
});
