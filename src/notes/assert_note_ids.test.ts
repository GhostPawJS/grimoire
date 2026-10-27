import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { assertNoteIds } from './assert_note_ids.ts';
import { dropNote } from './drop_note.ts';

test('existing note IDs pass and missing IDs are listed before writes', () => {
	const db = createTestDb();
	try {
		const note = dropNote(db, { content: 'Evidence', source: 'practice' });
		assertNoteIds(db, [note.id]);
		assert.throws(() => assertNoteIds(db, [note.id, 999, 1000]), /Notes not found: 999, 1000/);
	} finally {
		db.close();
	}
});
