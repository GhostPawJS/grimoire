import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseNoteContent } from './parse_note_content.ts';

test('empty note content is invalid_input before any other CLI requirement', () => {
	assert.equal(parseNoteContent('Evidence'), 'Evidence');
	for (const value of ['', '  '])
		assert.throws(() => parseNoteContent(value), { errorCode: 'invalid_input', exitCode: 2 });
});
