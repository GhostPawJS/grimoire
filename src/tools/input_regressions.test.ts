import assert from 'node:assert/strict';
import { test } from 'node:test';
import { logEvent } from '../events/log_event.ts';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { dropNoteTool } from './drop_note_tool.ts';
import { honeSpellTool } from './hone_spell_tool.ts';
import { inscribeSpellTool } from './inscribe_spell_tool.ts';
import { manageDraftTool } from './manage_draft_tool.ts';
import { manageSpellTool } from './manage_spell_tool.ts';
import { reviewGrimoireTool } from './review_grimoire_tool.ts';

const content = '---\nname: example\ndescription: Example procedure\n---\nBody\n';

test('empty notes, missing draft evidence, unknown IDs, mismatched names, paths, and refs have recoverable errors', async () => {
	const db = createTestDb();
	const { root, cleanup } = createTestRoot();
	const ctx = { root, db };
	try {
		for (const text of ['', '  ']) {
			const result = await dropNoteTool.handler(ctx, { content: text, source: 'practice' });
			assert.equal(result.outcome, 'error');
			if (result.outcome === 'error') assert.equal(result.error.code, 'invalid_input');
		}
		const missing = await manageDraftTool.handler(ctx, {
			action: 'submit',
			title: 'Title',
			rationale: 'Evidence',
			chapter: 'ops',
		});
		assert.equal(missing.outcome, 'error');
		if (missing.outcome === 'error') assert.equal(missing.error.code, 'invalid_input');
		for (const result of [
			await manageDraftTool.handler(ctx, {
				action: 'submit',
				title: 'Title',
				rationale: 'Evidence',
				chapter: 'ops',
				note_ids: [999, 1000],
			}),
			await honeSpellTool.handler(ctx, { noteIds: [999, 1000] }),
		]) {
			assert.equal(result.outcome, 'error');
			if (result.outcome === 'error') {
				assert.equal(result.error.code, 'not_found');
				assert.match(result.error.message, /999, 1000/);
			}
		}
		const mismatch = await inscribeSpellTool.handler(ctx, { name: 'other', content });
		assert.equal(mismatch.outcome, 'error');
		if (mismatch.outcome === 'error') assert.equal(mismatch.error.code, 'invalid_input');
		const notFound = await honeSpellTool.handler(ctx, { paths: ['ops/missing'] });
		assert.equal(notFound.outcome, 'error');
		if (notFound.outcome === 'error') assert.equal(notFound.error.code, 'not_found');
		const ref = await manageSpellTool.handler(ctx, {
			action: 'rollback',
			path: 'general/example',
			ref: 'deadbeef',
		});
		assert.equal(ref.outcome, 'error');
		if (ref.outcome === 'error') {
			assert.equal(ref.error.code, 'not_found');
			assert.match(ref.error.recovery ?? '', /inspect/);
		}
	} finally {
		db.close();
		cleanup();
	}
});

test('compact writes omit content, verbose opts in, identical force is no_op, and deleting purges events', async () => {
	const db = createTestDb();
	const { root, cleanup } = createTestRoot();
	const ctx = { root, db };
	try {
		const created = await inscribeSpellTool.handler(ctx, { name: 'example', content });
		assert.ok(created.ok);
		assert.equal(created.data.path, 'general/example');
		assert.equal(Object.hasOwn(created.data, 'spell'), false);
		const repeated = await inscribeSpellTool.handler(ctx, {
			name: 'example',
			content,
			force: true,
			verbose: true,
		});
		assert.ok(repeated.ok);
		assert.equal(repeated.outcome, 'no_op');
		assert.equal(repeated.data.spell?.body.trim(), 'Body');
		logEvent(db, { spell: created.data.path, event: 'read' });
		assert.ok(
			(await manageSpellTool.handler(ctx, { action: 'delete', path: created.data.path })).ok,
		);
		const review = await reviewGrimoireTool.handler(ctx, { view: 'resonance' });
		assert.ok(review.ok);
		assert.deepEqual(review.data.resonance, {});
	} finally {
		db.close();
		cleanup();
	}
});
