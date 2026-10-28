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

it('maps registry repository/path fields and warns on GitHub authentication responses', async (t) => {
	for (const status of [401, 403]) {
		t.mock.method(globalThis, 'fetch', async (url: string) =>
			url.includes('agentskillhub')
				? Response.json({
						results: [
							{
								slug: 'pdf',
								name: 'pdf',
								description: 'PDF',
								source_repo: 'https://github.com/owner/repo',
								source_path: 'skills/pdf/SKILL.md',
							},
						],
					})
				: new Response('', { status }),
		);
		const warnings: { code: string; message: string }[] = [];
		const results = await searchSkills('pdf', { onWarning: (warning) => warnings.push(warning) });
		assert.equal(results[0]?.sourceRepo, 'owner/repo');
		assert.equal(results[0]?.fetchUrl, 'https://github.com/owner/repo/tree/HEAD/skills/pdf');
		assert.deepEqual(warnings, [
			{ code: 'auth_required', message: 'Set GITHUB_TOKEN to search GitHub' },
		]);
	}
});

it('derives a fetch URL from registry repo, ref, and directory path fields', async (t) => {
	t.mock.method(globalThis, 'fetch', async () =>
		Response.json({
			skills: [
				{
					slug: 'pdf',
					name: 'pdf',
					description: 'PDF',
					repo: 'owner/repo',
					ref: 'main',
					path: 'skills/pdf',
				},
			],
		}),
	);
	const results = await searchSkills('pdf', { sources: ['agentskillhub'] });
	assert.equal(results[0]?.sourceRepo, 'owner/repo');
	assert.equal(results[0]?.sourcePath, 'skills/pdf');
	assert.equal(results[0]?.fetchUrl, 'https://github.com/owner/repo/tree/main/skills/pdf');
});

it('resolves the skill folder for registry entries that only name a repository', async (t) => {
	const calls: string[] = [];
	t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
		const url = String(input);
		calls.push(url);
		if (url.startsWith('https://agentskillhub.dev/'))
			return Response.json({
				skills: [
					{
						slug: 'pdf',
						name: 'pdf',
						description: 'PDF files',
						totalInstalls: 8,
						sourceIdentifier: 'anthropics/skills',
					},
					{
						slug: 'gone',
						name: 'gone',
						description: 'Missing',
						sourceIdentifier: 'anthropics/skills',
					},
					{ slug: 'bad', name: 'bad', description: 'Bad repo', sourceIdentifier: '../etc' },
				],
			});
		if (url.includes('/git/trees/'))
			return Response.json({
				tree: [
					{ path: 'skills/pdf/SKILL.md', type: 'blob' },
					{ path: 'archive/old/pdf/SKILL.md', type: 'blob' },
					{ path: 'skills/pdf/reference.md', type: 'blob' },
				],
			});
		return new Response('', { status: 500 });
	});
	const warnings: Array<{ code: string; message: string }> = [];
	const results = await searchSkills('pdf', {
		sources: ['agentskillhub'],
		onWarning: (warning) => warnings.push(warning),
	});
	assert.deepEqual(
		results.map((r) => [r.slug, r.sourceRepo, r.fetchUrl, r.sourcePath, r.adoptionCount]),
		[
			[
				'pdf',
				'anthropics/skills',
				'https://github.com/anthropics/skills/tree/HEAD/skills/pdf',
				'skills/pdf/SKILL.md',
				8,
			],
			['gone', 'anthropics/skills', 'https://github.com/anthropics/skills', undefined, undefined],
		],
	);
	assert.equal(calls.filter((url) => url.includes('/git/trees/')).length, 1);
	assert.deepEqual(
		warnings.map((w) => w.code),
		['path_unresolved'],
	);
	assert.match(warnings[0]?.message ?? '', /gone \(anthropics\/skills\)/);
});

it('reports an unresolved folder when the repository tree cannot be read', async (t) => {
	t.mock.method(globalThis, 'fetch', async (input: string | URL) =>
		String(input).startsWith('https://agentskillhub.dev/')
			? Response.json([{ slug: 'pdf', name: 'pdf', description: 'PDF', sourceIdentifier: 'o/r' }])
			: new Response('rate limited', { status: 403 }),
	);
	const warnings: string[] = [];
	const results = await searchSkills('pdf', {
		sources: ['agentskillhub'],
		onWarning: (warning) => warnings.push(warning.code),
	});
	assert.equal(results[0]?.fetchUrl, 'https://github.com/o/r');
	assert.deepEqual(warnings, ['path_unresolved']);
});
