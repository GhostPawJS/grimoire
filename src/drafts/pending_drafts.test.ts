import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { approveDraft } from './approve_draft.ts';
import { pendingDrafts } from './pending_drafts.ts';
import { submitDraft } from './submit_draft.ts';

describe('pendingDrafts', () => {
	it('returns only pending drafts, newest id first', () => {
		const db = createTestDb();
		submitDraft(db, {
			title: 'Old',
			rationale: 'r',
			noteIds: [1],
			chapter: 'a',
			now: 1,
		});
		const { id: mid } = submitDraft(db, {
			title: 'Mid',
			rationale: 'r',
			noteIds: [2],
			chapter: 'b',
			now: 2,
		});
		submitDraft(db, {
			title: 'New',
			rationale: 'r',
			noteIds: [3],
			chapter: 'c',
			now: 3,
		});

		approveDraft(db, mid);

		const list = pendingDrafts(db);
		assert.equal(list.length, 2);
		assert.equal(list[0]?.title, 'New');
		assert.equal(list[1]?.title, 'Old');

		db.close();
	});
});
