import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as notes from './index.ts';

describe('notes index exports', () => {
	it('exports core functions', () => {
		assert.equal(typeof notes.distill, 'function');
		assert.equal(typeof notes.dropNote, 'function');
		assert.equal(typeof notes.dropNotes, 'function');
		assert.equal(typeof notes.enforceNoteCap, 'function');
		assert.equal(typeof notes.expireNotes, 'function');
		assert.equal(typeof notes.initNoteTables, 'function');
		assert.equal(typeof notes.listNotes, 'function');
		assert.equal(typeof notes.mapNoteRow, 'function');
		assert.equal(typeof notes.normalizeNoteContent, 'function');
		assert.equal(typeof notes.noteCounts, 'function');
		assert.equal(typeof notes.pendingNoteCount, 'function');
		assert.equal(typeof notes.pendingNotes, 'function');
	});
});
