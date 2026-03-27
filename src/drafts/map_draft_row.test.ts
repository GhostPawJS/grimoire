import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapDraftRow } from './map_draft_row.ts';
import type { SpellDraftRow } from './types.ts';

describe('mapDraftRow', () => {
	it('maps a row and parses note_ids JSON', () => {
		const row: SpellDraftRow = {
			id: 7,
			title: 'Test spell',
			rationale: 'Because',
			note_ids: '[1,2,3]',
			chapter: 'alpha',
			status: 'pending',
			created_at: 42,
		};
		const draft = mapDraftRow(row);
		assert.deepEqual(draft, {
			id: 7,
			title: 'Test spell',
			rationale: 'Because',
			noteIds: [1, 2, 3],
			chapter: 'alpha',
			status: 'pending',
			createdAt: 42,
		});
	});
});
