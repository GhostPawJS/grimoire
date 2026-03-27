import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapNoteRow } from './map_note_row.ts';
import type { SpellNoteRow } from './types.ts';

describe('mapNoteRow', () => {
	it('maps snake_case row to camelCase SpellNote', () => {
		const row: SpellNoteRow = {
			id: 42,
			source: 'grimoire',
			source_id: 'sid-1',
			content: 'observed effect',
			domain: 'fire',
			status: 'distilled',
			distilled_by: '/spells/foo',
			created_at: 1_700_000_000_000,
		};
		assert.deepEqual(mapNoteRow(row), {
			id: 42,
			source: 'grimoire',
			sourceId: 'sid-1',
			content: 'observed effect',
			domain: 'fire',
			status: 'distilled',
			distilledBy: '/spells/foo',
			createdAt: 1_700_000_000_000,
		});
	});
});
