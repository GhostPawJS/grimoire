import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeNoteContent } from './normalize_note_content.ts';

describe('normalizeNoteContent', () => {
	it('trims leading and trailing whitespace', () => {
		assert.equal(normalizeNoteContent('  hello  '), 'hello');
	});

	it('collapses internal whitespace to single spaces', () => {
		assert.equal(normalizeNoteContent('a\tb\nc  d'), 'a b c d');
	});

	it('returns empty string for whitespace-only input', () => {
		assert.equal(normalizeNoteContent('   \t\n  '), '');
	});
});
