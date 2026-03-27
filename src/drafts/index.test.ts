import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	approveDraft,
	dismissDraft,
	initDraftTables,
	mapDraftRow,
	pendingDrafts,
	submitDraft,
} from './index.ts';

describe('drafts/index exports', () => {
	it('exports key functions', () => {
		assert.equal(typeof approveDraft, 'function');
		assert.equal(typeof dismissDraft, 'function');
		assert.equal(typeof initDraftTables, 'function');
		assert.equal(typeof mapDraftRow, 'function');
		assert.equal(typeof pendingDrafts, 'function');
		assert.equal(typeof submitDraft, 'function');
	});
});
