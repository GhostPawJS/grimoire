import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { dropNoteTool } from './drop_note_tool.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';

describe('dropNoteTool', () => {
	it('returns noteId on success', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		const result = await dropNoteTool.handler(ctx, {
			content: 'TypeScript generics are covariant by default.',
			source: 'user',
		});
		assert.equal(result.ok, true);
		assert.equal(result.outcome, 'success');
		if (result.ok) {
			assert.equal(result.data.noteId, 1);
		}
		assert.match(result.summary, /Dropped note #1/);
		db.close();
	});

	it('passes domain through to dropNote', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		const result = await dropNoteTool.handler(ctx, {
			content: 'Testing insight',
			source: 'agent',
			domain: 'testing',
		});
		assert.equal(result.ok, true);
		if (result.ok) {
			assert.equal(result.data.noteId, 1);
		}
		const row = db
			.prepare('SELECT domain FROM spell_notes WHERE id = 1')
			.get<{ domain: string | null }>();
		assert.equal(row?.domain, 'testing');
		db.close();
	});

	it('suggests catalogue when pending notes reach 10', async () => {
		const db = createTestDb();
		const ctx: GrimoireToolContext = { root: '/tmp', db };
		for (let i = 0; i < 9; i++) {
			await dropNoteTool.handler(ctx, { content: `note ${i}`, source: 'user' });
		}
		const result = await dropNoteTool.handler(ctx, { content: 'note 9', source: 'user' });
		assert.equal(result.ok, true);
		const catalogueHint = result.next?.find((n) => n.message.includes('catalogue'));
		assert.ok(catalogueHint, 'should suggest catalogue when 10+ notes pending');
		db.close();
	});

	it('returns failure when no database is available', async () => {
		const ctx: GrimoireToolContext = { root: '/tmp' };
		const result = await dropNoteTool.handler(ctx, { content: 'test', source: 'user' });
		assert.equal(result.ok, false);
		assert.equal(result.outcome, 'error');
		if (!result.ok && result.outcome === 'error') {
			assert.equal(result.error.code, 'system_error');
			assert.ok(result.error.recovery);
		}
	});

	it('has correct metadata', () => {
		assert.equal(dropNoteTool.name, 'drop_note');
		assert.equal(dropNoteTool.readOnly, false);
		assert.equal(dropNoteTool.sideEffects, 'writes_state');
		assert.deepEqual(dropNoteTool.targetKinds, ['note']);
	});
});
