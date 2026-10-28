import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { scoutSkillsTool } from '../tools/scout_skills_tool.ts';
import { analyzeRepo } from './analyze_repo.ts';
import { refreshIndex } from './refresh_index.ts';
import { searchSkills } from './search_skills.ts';

const item = {
	source: 'agentskillhub',
	slug: 'sample',
	name: 'sample',
	description: 'Example',
	sourceRepo: 'owner/repo',
	fetchUrl: 'https://example.invalid/SKILL.md',
};

describe('remote registry operations with injected fetch', () => {
	it('maps both sources, deduplicates slugs, encodes queries and limits results', async (t) => {
		const urls: string[] = [];
		t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
			const url = String(input);
			urls.push(url);
			return Response.json(
				url.includes('api.github.com')
					? {
							items: [
								{ repository: { full_name: 'owner/repo' }, path: 'SKILL.md', name: 'SKILL.md' },
							],
						}
					: [
							item,
							{ ...item, adoptionCount: 3, sourcePath: 'skills/sample' },
							{
								...item,
								slug: 'other',
								adoptionCount: 2,
								sourcePath: 'skills/other',
							},
						],
			);
		});
		const results = await searchSkills('a b');
		assert.equal(results.length, 3);
		const toolResult = await scoutSkillsTool.handler(
			{ root: '.' },
			{ action: 'search', query: 'a b' },
		);
		assert.equal(toolResult.ok, true);
		assert.equal(toolResult.next?.length, 3);
		assert.equal(toolResult.next?.[0]?.suggestedInput?.source, item.fetchUrl);
		assert.deepEqual(results[0], item);
		assert.equal(results[1]?.adoptionCount, 2);
		assert.equal(results[1]?.sourcePath, 'skills/other');
		assert.equal(results[2]?.fetchUrl, 'https://github.com/owner/repo');
		assert.ok(urls.every((url) => url.includes('a%20b')));
		assert.equal((await searchSkills('query', { limit: 1 })).length, 1);
		assert.deepEqual(await searchSkills('query', { sources: [] }), []);
	});

	it('ignores unsuccessful searches and surfaces transport failures', async (t) => {
		t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
		assert.deepEqual(await searchSkills('query'), []);
		t.mock.method(globalThis, 'fetch', async () => {
			throw new Error('offline');
		});
		await assert.rejects(searchSkills('query'), /offline/);
	});

	it('refreshes new and existing rows, including optional fields and failed terms', async (t) => {
		const db = createTestDb();
		const urls: string[] = [];
		t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
			urls.push(String(input));
			if (String(input).includes('fail')) return new Response(null, { status: 503 });
			return Response.json([
				item,
				{ ...item, slug: 'other', adoptionCount: 5, sourcePath: 'skills/other' },
			]);
		});
		try {
			assert.deepEqual(await refreshIndex(db, { searchTerms: ['a b', 'fail'] }), {
				added: 2,
				updated: 0,
			});
			assert.ok(urls[0]?.includes('a%20b'));
			assert.deepEqual(await refreshIndex(db), { added: 0, updated: 12 });
			assert.deepEqual(
				db
					.prepare('SELECT adoption_count, source_path FROM scout_index WHERE slug = ?')
					.get('other'),
				{
					adoption_count: 5,
					source_path: 'skills/other',
				},
			);
		} finally {
			db.close();
		}
	});

	it('posts repository analysis requests and reports unsuccessful responses', async (t) => {
		const url = 'https://example.invalid/repo';
		const analysis = { skills: [], repo: 'owner/repo', branch: 'main' };
		t.mock.method(
			globalThis,
			'fetch',
			async (input: string | URL | Request, init?: RequestInit) => {
				assert.equal(String(input), 'https://agentskillhub.dev/api/v1/repos/analyze');
				assert.equal(init?.method, 'POST');
				assert.deepEqual(JSON.parse(String(init?.body)), { url: url });
				return Response.json(analysis);
			},
		);
		assert.deepEqual(await analyzeRepo(url), analysis);
		t.mock.method(
			globalThis,
			'fetch',
			async () => new Response(null, { status: 503, statusText: 'Unavailable' }),
		);
		await assert.rejects(analyzeRepo(url), /503 Unavailable/);
	});
});

it('scout search returns registry matches together with the GitHub authentication hint', async (t) => {
	t.mock.method(globalThis, 'fetch', async (url: string) =>
		url.includes('agentskillhub') ? Response.json([item]) : new Response('', { status: 401 }),
	);
	const result = await scoutSkillsTool.handler(
		{ root: '.' },
		{ action: 'search', query: 'sample' },
	);
	assert.ok(result.ok);
	assert.equal(
		result.warnings?.find((warning) => warning.code === 'auth_required')?.message,
		'Set GITHUB_TOKEN to search GitHub',
	);
	assert.equal(result.next?.[0]?.suggestedInput?.source, item.fetchUrl);
});
