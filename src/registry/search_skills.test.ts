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

it('accepts enveloped registry results and ignores malformed response shapes', async (t) => {
	const item = {
		slug: 'pdf',
		name: 'pdf',
		description: 'PDF processing',
		sourceRepo: 'owner/repo',
		fetchUrl: 'https://example.invalid/pdf/SKILL.md',
	};
	for (const payload of [
		{ results: [item], total: 1 },
		{ skills: [item] },
		{ data: [item] },
		[item],
	]) {
		t.mock.method(globalThis, 'fetch', async () => Response.json(payload));
		assert.equal((await searchSkills('pdf', { sources: ['agentskillhub'] }))[0]?.name, 'pdf');
	}
	for (const payload of [null, {}, { results: {} }, 'invalid', [null, 1, {}, { slug: 1 }]]) {
		t.mock.method(globalThis, 'fetch', async () => Response.json(payload));
		assert.deepEqual(await searchSkills('pdf'), []);
	}
});
