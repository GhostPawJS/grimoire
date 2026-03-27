import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { reviewGrimoireTool } from './review_grimoire_tool.ts';

describe('reviewGrimoireTool', () => {
	const { root, cleanup } = createTestRoot({
		chapters: [
			{
				name: 'basics',
				spells: [{ name: 'hello-world' }],
			},
			{
				name: 'advanced',
				spells: [{ name: 'teleport' }],
			},
		],
	});

	after(cleanup);

	describe('chapters view', () => {
		it('lists chapters with spell counts', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'chapters' });
			assert.equal(result.ok, true);
			if (!result.ok) return;
			const data = result.data as { chapters: Record<string, number>; totalSpells: number };
			assert.equal(data.totalSpells, 2);
			assert.equal(data.chapters.basics, 1);
			assert.equal(data.chapters.advanced, 1);
		});

		it('provides entities for discovered spells', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'chapters' });
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.ok(result.entities.length > 0);
			assert.equal(result.entities[0]?.kind, 'spell');
		});
	});

	describe('index view', () => {
		it('returns index entries and formatted output', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'index' });
			assert.equal(result.ok, true);
			if (!result.ok) return;
			const data = result.data as { entries: unknown[]; formatted: string; totalEntries: number };
			assert.equal(data.totalEntries, 2);
			assert.equal(typeof data.formatted, 'string');
			assert.ok(data.formatted.includes('hello-world'));
		});

		it('respects limit parameter', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'index', limit: 1 });
			assert.equal(result.ok, true);
			if (!result.ok) return;
			const data = result.data as { entries: unknown[]; totalEntries: number };
			assert.equal(data.entries.length, 1);
			assert.equal(data.totalEntries, 2);
		});
	});

	describe('db-required views', () => {
		it('returns failure for health view without db', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'health' });
			assert.equal(result.ok, false);
			if (result.ok) return;
			assert.equal(result.outcome, 'error');
			const warning = result.warnings?.[0];
			assert.ok(warning);
			assert.equal(warning.code, 'degraded_no_db');
		});

		it('returns failure for resonance view without db', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'resonance' });
			assert.equal(result.ok, false);
		});

		it('returns failure for notes view without db', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'notes' });
			assert.equal(result.ok, false);
		});
	});

	describe('validation view', () => {
		it('validates all spells', async () => {
			const result = await reviewGrimoireTool.handler({ root }, { view: 'validation' });
			assert.equal(result.ok, true);
			if (!result.ok) return;
			const data = result.data as { results: unknown[]; invalidCount: number };
			assert.equal(data.results.length, 2);
			assert.equal(typeof data.invalidCount, 'number');
		});
	});
});
