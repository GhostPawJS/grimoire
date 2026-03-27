import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { submitDraft } from './submit_draft.ts';
import type { SpellDraftRow } from './types.ts';

describe('submitDraft', () => {
	it('inserts a row and returns the id', () => {
		const db = createTestDb();
		const { id } = submitDraft(db, {
			title: 'Draft title',
			rationale: 'Why not',
			noteIds: [10, 20],
			chapter: 'beta',
			now: 99,
		});
		assert.equal(id, 1);

		const row = db
			.prepare(
				'SELECT id, title, rationale, note_ids, chapter, status, created_at FROM spell_drafts WHERE id = ?',
			)
			.get<SpellDraftRow>(id);
		assert.ok(row);
		assert.equal(row?.title, 'Draft title');
		assert.equal(row?.rationale, 'Why not');
		assert.equal(row?.note_ids, '[10,20]');
		assert.equal(row?.chapter, 'beta');
		assert.equal(row?.status, 'pending');
		assert.equal(row?.created_at, 99);

		db.close();
	});
});
