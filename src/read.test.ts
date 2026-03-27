import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as read from './read.ts';

describe('read barrel', () => {
	it('exports listChapters', () => {
		assert.equal(typeof read.listChapters, 'function');
	});

	it('exports listSpells', () => {
		assert.equal(typeof read.listSpells, 'function');
	});

	it('exports getSpell', () => {
		assert.equal(typeof read.getSpell, 'function');
	});

	it('exports getContent', () => {
		assert.equal(typeof read.getContent, 'function');
	});

	it('exports renderContent', () => {
		assert.equal(typeof read.renderContent, 'function');
	});

	it('exports buildIndex', () => {
		assert.equal(typeof read.buildIndex, 'function');
	});

	it('exports formatIndex', () => {
		assert.equal(typeof read.formatIndex, 'function');
	});

	it('exports rank', () => {
		assert.equal(typeof read.rank, 'function');
	});

	it('exports allRanks', () => {
		assert.equal(typeof read.allRanks, 'function');
	});

	it('exports tier', () => {
		assert.equal(typeof read.tier, 'function');
	});

	it('exports tierInfo', () => {
		assert.equal(typeof read.tierInfo, 'function');
	});

	it('exports pendingChanges', () => {
		assert.equal(typeof read.pendingChanges, 'function');
	});

	it('exports diff', () => {
		assert.equal(typeof read.diff, 'function');
	});

	it('exports history', () => {
		assert.equal(typeof read.history, 'function');
	});

	it('exports isGitAvailable', () => {
		assert.equal(typeof read.isGitAvailable, 'function');
	});

	it('exports resonance', () => {
		assert.equal(typeof read.resonance, 'function');
	});

	it('exports allResonance', () => {
		assert.equal(typeof read.allResonance, 'function');
	});

	it('exports eventsSince', () => {
		assert.equal(typeof read.eventsSince, 'function');
	});

	it('exports validate', () => {
		assert.equal(typeof read.validate, 'function');
	});

	it('exports validateAll', () => {
		assert.equal(typeof read.validateAll, 'function');
	});

	it('exports checkTierRequirements', () => {
		assert.equal(typeof read.checkTierRequirements, 'function');
	});

	it('exports validateSkillMd', () => {
		assert.equal(typeof read.validateSkillMd, 'function');
	});

	it('exports parseSkillMd', () => {
		assert.equal(typeof read.parseSkillMd, 'function');
	});

	it('exports serializeSkillMd', () => {
		assert.equal(typeof read.serializeSkillMd, 'function');
	});

	it('exports countBodyLines', () => {
		assert.equal(typeof read.countBodyLines, 'function');
	});

	it('exports listNotes', () => {
		assert.equal(typeof read.listNotes, 'function');
	});

	it('exports pendingNotes', () => {
		assert.equal(typeof read.pendingNotes, 'function');
	});

	it('exports pendingNoteCount', () => {
		assert.equal(typeof read.pendingNoteCount, 'function');
	});

	it('exports noteCounts', () => {
		assert.equal(typeof read.noteCounts, 'function');
	});

	it('exports readCatalogue', () => {
		assert.equal(typeof read.readCatalogue, 'function');
	});

	it('exports pendingDrafts', () => {
		assert.equal(typeof read.pendingDrafts, 'function');
	});

	it('exports allProvenance', () => {
		assert.equal(typeof read.allProvenance, 'function');
	});

	it('exports getProvenance', () => {
		assert.equal(typeof read.getProvenance, 'function');
	});

	it('exports searchIndex', () => {
		assert.equal(typeof read.searchIndex, 'function');
	});
});
