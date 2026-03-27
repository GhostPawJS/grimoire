import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
	DropNoteInput,
	NoteCountRecord,
	NoteStatus,
	SpellNote,
	SpellNoteRow,
} from './types.ts';

describe('types', () => {
	it('module can be imported', () => {
		const _row: SpellNoteRow = {
			id: 1,
			source: 's',
			source_id: null,
			content: 'c',
			domain: null,
			status: 'pending',
			distilled_by: null,
			created_at: 0,
		};
		const _note: SpellNote = {
			id: 1,
			source: 's',
			sourceId: null,
			content: 'c',
			domain: null,
			status: 'pending',
			distilledBy: null,
			createdAt: 0,
		};
		const _status: NoteStatus = 'distilled';
		const _input: DropNoteInput = { source: 'x', content: 'y' };
		const _count: NoteCountRecord = { source: 'a', domain: null, count: 1 };
		assert.ok(_row && _note && _status && _input && _count);
	});
});
