import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { inspectGrimoireItemTool } from './inspect_grimoire_item_tool.ts';

describe('inspectGrimoireItemTool', () => {
	const { root, cleanup } = createTestRoot({
		chapters: [
			{
				name: 'basics',
				spells: [{ name: 'hello-world' }],
			},
		],
	});

	after(cleanup);

	it('returns spell data for a valid path', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.spell.name, 'hello-world');
		assert.equal(result.data.spell.chapter, 'basics');
		assert.equal(result.data.spell.path, 'basics/hello-world');
	});

	it('returns tier info for the spell', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.tierInfo.tier, 'Uncheckpointed');
		assert.equal(result.data.tierInfo.rank, 0);
		assert.equal(result.data.tierInfo.sealsToNextTier, 1);
	});

	it('includes validation result', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.data.validation);
		assert.equal(result.data.validation.path, 'basics/hello-world');
	});

	it('omits resonance and provenance when no db', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.data.resonance, undefined);
		assert.equal(result.data.provenance, undefined);
	});

	it('includes degraded warnings when db and git are missing', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.warnings);
		assert.ok(result.warnings.length >= 2);
		const codes = result.warnings.map((w) => w.code);
		assert.ok(codes.includes('degraded_no_db'));
		assert.ok(codes.includes('degraded_no_git'));
	});

	it('suggests honeNext for uncheckpointed spells', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.next);
		const hone = result.next.find((n) => n.tool === 'hone_spell');
		assert.ok(hone);
	});

	it('always suggests reviewViewNext(health)', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/hello-world' });
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.next);
		const health = result.next.find(
			(n) => n.kind === 'review_view' && n.suggestedInput?.view === 'health',
		);
		assert.ok(health);
	});

	it('returns error for non-existent spell', async () => {
		const result = await inspectGrimoireItemTool.handler({ root }, { path: 'basics/nonexistent' });
		assert.equal(result.ok, false);
		if (result.ok) return;
		assert.equal(result.outcome, 'error');
	});
});
