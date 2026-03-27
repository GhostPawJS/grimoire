import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { approveDraft } from './approve_draft.ts';
import { submitDraft } from './submit_draft.ts';

describe('approveDraft', () => {
	it('approves a pending draft', () => {
		const db = createTestDb();
		const { id } = submitDraft(db, {
			title: 'T',
			rationale: 'R',
			noteIds: [],
			chapter: 'c',
			now: 1,
		});
		approveDraft(db, id);
		const status = db
			.prepare('SELECT status FROM spell_drafts WHERE id = ?')
			.get<{ status: string }>(id);
		assert.equal(status?.status, 'approved');
		db.close();
	});

	it('throws when the draft is missing', () => {
		const db = createTestDb();
		assert.throws(
			() => approveDraft(db, 999),
			(err) => err instanceof GrimoireNotFoundError,
		);
		db.close();
	});

	it('throws when the draft is not pending', () => {
		const db = createTestDb();
		const { id } = submitDraft(db, {
			title: 'T',
			rationale: 'R',
			noteIds: [],
			chapter: 'c',
			now: 1,
		});
		approveDraft(db, id);
		assert.throws(
			() => approveDraft(db, id),
			(err) => err instanceof GrimoireNotFoundError,
		);
		db.close();
	});
});
