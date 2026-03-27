import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { searchGrimoireTool } from './search_grimoire_tool.ts';

describe('searchGrimoireTool', () => {
	const { root, cleanup } = createTestRoot({
		chapters: [
			{
				name: 'basics',
				spells: [{ name: 'hello-world' }, { name: 'goodbye-world' }],
			},
		],
	});

	after(cleanup);

	it('finds spells matching query by name', async () => {
		const result = await searchGrimoireTool.handler({ root }, { query: 'hello' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.count, 1);
		assert.equal(result.data.results.length, 1);
		const first = result.data.results[0];
		assert.ok(first);
		assert.equal(first.name, 'hello-world');
	});

	it('finds spells matching query by description', async () => {
		const result = await searchGrimoireTool.handler({ root }, { query: 'test spell' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.count, 2);
	});

	it('returns empty_result warning when no spells match', async () => {
		const result = await searchGrimoireTool.handler({ root }, { query: 'nonexistent-xyz' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.count, 0);
		assert.equal(result.data.results.length, 0);
		const warning = result.warnings?.[0];
		assert.ok(warning);
		assert.equal(warning.code, 'empty_result');
	});

	it('suggests review_grimoire when no results found', async () => {
		const result = await searchGrimoireTool.handler({ root }, { query: 'nonexistent-xyz' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		const hint = result.next?.[0];
		assert.ok(hint);
		assert.equal(hint.kind, 'review_view');
	});

	it('filters results by chapter', async () => {
		const result = await searchGrimoireTool.handler(
			{ root },
			{ query: 'test spell', chapters: ['nonexistent-chapter'] },
		);
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.count, 0);
	});
});
