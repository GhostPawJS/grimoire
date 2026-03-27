import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { manageDraftTool } from './manage_draft_tool.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';

describe('manageDraftTool', () => {
	it('submits a draft and returns draftId', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		const result = await manageDraftTool.handler(ctx, {
			action: 'submit',
			title: 'New spell idea',
			rationale: 'Covers a gap in testing chapter',
			noteIds: [1, 2, 3],
			chapter: 'testing',
		});
		assert.equal(result.ok, true);
		assert.equal(result.outcome, 'success');
		if (result.ok) {
			assert.equal(result.data.draftId, 1);
			assert.equal(result.data.action, 'submit');
		}
		assert.match(result.summary, /Submitted draft #1/);
		db.close();
	});

	it('approves a pending draft', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		await manageDraftTool.handler(ctx, {
			action: 'submit',
			title: 'Approvable draft',
			rationale: 'Good reason',
			noteIds: [1],
			chapter: 'alpha',
		});
		const result = await manageDraftTool.handler(ctx, { action: 'approve', draftId: 1 });
		assert.equal(result.ok, true);
		if (result.ok) {
			assert.equal(result.data.action, 'approve');
			assert.equal(result.data.draftId, 1);
		}
		const next = result.next?.find((n) => n.tool === 'inscribe_spell');
		assert.ok(next, 'should suggest inscribe_spell after approval');
		db.close();
	});

	it('dismisses a pending draft', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		await manageDraftTool.handler(ctx, {
			action: 'submit',
			title: 'Dismissable draft',
			rationale: 'Meh',
			noteIds: [1],
			chapter: 'beta',
		});
		const result = await manageDraftTool.handler(ctx, { action: 'dismiss', draftId: 1 });
		assert.equal(result.ok, true);
		if (result.ok) {
			assert.equal(result.data.action, 'dismiss');
			assert.equal(result.data.draftId, 1);
		}
		db.close();
	});

	it('returns error when approving nonexistent draft', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		const result = await manageDraftTool.handler(ctx, { action: 'approve', draftId: 999 });
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		db.close();
	});

	it('returns failure when no database is available', async () => {
		const ctx: GrimoireToolContext = { root: '/tmp' };
		const result = await manageDraftTool.handler(ctx, { action: 'approve', draftId: 1 });
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		if (!result.ok && result.outcome === 'error') {
			assert.equal(result.error.code, 'system_error');
			assert.ok(result.error.recovery);
		}
	});

	it('has correct metadata', () => {
		assert.equal(manageDraftTool.name, 'manage_draft');
		assert.equal(manageDraftTool.readOnly, false);
		assert.equal(manageDraftTool.sideEffects, 'writes_state');
		assert.deepEqual(manageDraftTool.targetKinds, ['draft']);
	});
});
