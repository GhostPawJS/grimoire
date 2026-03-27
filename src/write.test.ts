import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as write from './write.ts';

describe('write barrel', () => {
	it('exports inscribe', () => {
		assert.equal(typeof write.inscribe, 'function');
	});

	it('exports deleteSpell', () => {
		assert.equal(typeof write.deleteSpell, 'function');
	});

	it('exports shelve', () => {
		assert.equal(typeof write.shelve, 'function');
	});

	it('exports unshelve', () => {
		assert.equal(typeof write.unshelve, 'function');
	});

	it('exports moveSpell', () => {
		assert.equal(typeof write.moveSpell, 'function');
	});

	it('exports repair', () => {
		assert.equal(typeof write.repair, 'function');
	});

	it('exports repairAll', () => {
		assert.equal(typeof write.repairAll, 'function');
	});

	it('exports seal', () => {
		assert.equal(typeof write.seal, 'function');
	});

	it('exports rollback', () => {
		assert.equal(typeof write.rollback, 'function');
	});

	it('exports adoptSpell', () => {
		assert.equal(typeof write.adoptSpell, 'function');
	});

	it('exports adoptSpells', () => {
		assert.equal(typeof write.adoptSpells, 'function');
	});

	it('exports logEvent', () => {
		assert.equal(typeof write.logEvent, 'function');
	});

	it('exports distill', () => {
		assert.equal(typeof write.distill, 'function');
	});

	it('exports dropNote', () => {
		assert.equal(typeof write.dropNote, 'function');
	});

	it('exports dropNotes', () => {
		assert.equal(typeof write.dropNotes, 'function');
	});

	it('exports enforceNoteCap', () => {
		assert.equal(typeof write.enforceNoteCap, 'function');
	});

	it('exports expireNotes', () => {
		assert.equal(typeof write.expireNotes, 'function');
	});

	it('exports catalogue', () => {
		assert.equal(typeof write.catalogue, 'function');
	});

	it('exports approveDraft', () => {
		assert.equal(typeof write.approveDraft, 'function');
	});

	it('exports dismissDraft', () => {
		assert.equal(typeof write.dismissDraft, 'function');
	});

	it('exports submitDraft', () => {
		assert.equal(typeof write.submitDraft, 'function');
	});
});
