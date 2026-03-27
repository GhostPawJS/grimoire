import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as grimoire from './index.ts';

describe('index exports', () => {
	it('exports initGrimoireTables', () => {
		assert.equal(typeof grimoire.initGrimoireTables, 'function');
	});

	it('exports init', () => {
		assert.equal(typeof grimoire.init, 'function');
	});

	it('exports DEFAULTS', () => {
		assert.equal(typeof grimoire.DEFAULTS, 'object');
		assert.equal(grimoire.DEFAULTS.defaultChapter, 'general');
	});

	it('exports GrimoireError', () => {
		assert.equal(typeof grimoire.GrimoireError, 'function');
	});

	it('exports GrimoireNotFoundError', () => {
		assert.equal(typeof grimoire.GrimoireNotFoundError, 'function');
	});

	it('exports GrimoireValidationError', () => {
		assert.equal(typeof grimoire.GrimoireValidationError, 'function');
	});

	it('exports GrimoireStateError', () => {
		assert.equal(typeof grimoire.GrimoireStateError, 'function');
	});

	it('exports GrimoireInvariantError', () => {
		assert.equal(typeof grimoire.GrimoireInvariantError, 'function');
	});

	it('exports isGrimoireError', () => {
		assert.equal(typeof grimoire.isGrimoireError, 'function');
	});

	it('exports resolveNow', () => {
		assert.equal(typeof grimoire.resolveNow, 'function');
	});

	it('exports withTransaction', () => {
		assert.equal(typeof grimoire.withTransaction, 'function');
	});

	it('exports soul namespace', () => {
		assert.equal(typeof grimoire.soul, 'object');
		assert.equal(typeof grimoire.soul.grimoireSoul, 'object');
		assert.equal(typeof grimoire.soul.renderGrimoireSoulPromptFoundation, 'function');
	});

	it('exports read namespace', () => {
		assert.equal(typeof grimoire.read, 'object');
		assert.equal(typeof grimoire.read.eventsSince, 'function');
		assert.equal(typeof grimoire.read.readCatalogue, 'function');
		assert.equal(typeof grimoire.read.listSpells, 'function');
	});

	it('exports write namespace', () => {
		assert.equal(typeof grimoire.write, 'object');
		assert.equal(typeof grimoire.write.logEvent, 'function');
		assert.equal(typeof grimoire.write.dropNote, 'function');
		assert.equal(typeof grimoire.write.inscribe, 'function');
	});

	it('exports network namespace', () => {
		assert.equal(typeof grimoire.network, 'object');
		assert.equal(typeof grimoire.network.fetchSkills, 'function');
		assert.equal(typeof grimoire.network.scout, 'function');
	});

	it('exports catalogue namespace', () => {
		assert.equal(typeof grimoire.catalogue, 'object');
		assert.equal(typeof grimoire.catalogue.catalogue, 'function');
	});

	it('exports drafts namespace', () => {
		assert.equal(typeof grimoire.drafts, 'object');
		assert.equal(typeof grimoire.drafts.submitDraft, 'function');
		assert.equal(typeof grimoire.drafts.pendingDrafts, 'function');
	});

	it('exports events namespace', () => {
		assert.equal(typeof grimoire.events, 'object');
		assert.equal(typeof grimoire.events.logEvent, 'function');
		assert.equal(typeof grimoire.events.eventsSince, 'function');
	});

	it('exports git namespace', () => {
		assert.equal(typeof grimoire.git, 'object');
		assert.equal(typeof grimoire.git.seal, 'function');
		assert.equal(typeof grimoire.git.rank, 'function');
	});

	it('exports health namespace', () => {
		assert.equal(typeof grimoire.health, 'object');
		assert.equal(typeof grimoire.health.readCatalogue, 'function');
	});

	it('exports indexing namespace', () => {
		assert.equal(typeof grimoire.indexing, 'object');
		assert.equal(typeof grimoire.indexing.buildIndex, 'function');
	});

	it('exports notes namespace', () => {
		assert.equal(typeof grimoire.notes, 'object');
		assert.equal(typeof grimoire.notes.dropNote, 'function');
		assert.equal(typeof grimoire.notes.listNotes, 'function');
	});

	it('exports provenance namespace', () => {
		assert.equal(typeof grimoire.provenance, 'object');
		assert.equal(typeof grimoire.provenance.recordProvenance, 'function');
		assert.equal(typeof grimoire.provenance.getProvenance, 'function');
	});

	it('exports registry namespace', () => {
		assert.equal(typeof grimoire.registry, 'object');
		assert.equal(typeof grimoire.registry.upsertIndexEntry, 'function');
		assert.equal(typeof grimoire.registry.searchIndex, 'function');
	});

	it('exports scouting namespace', () => {
		assert.equal(typeof grimoire.scouting, 'object');
		assert.equal(typeof grimoire.scouting.adoptSpell, 'function');
		assert.equal(typeof grimoire.scouting.fetchSkills, 'function');
	});

	it('exports spec namespace', () => {
		assert.equal(typeof grimoire.spec, 'object');
		assert.equal(typeof grimoire.spec.parseSkillMd, 'function');
		assert.equal(typeof grimoire.spec.validateSkillMd, 'function');
	});

	it('exports spells namespace', () => {
		assert.equal(typeof grimoire.spells, 'object');
		assert.equal(typeof grimoire.spells.inscribe, 'function');
		assert.equal(typeof grimoire.spells.listSpells, 'function');
	});

	it('exports validation namespace', () => {
		assert.equal(typeof grimoire.validation, 'object');
		assert.equal(typeof grimoire.validation.validate, 'function');
		assert.equal(typeof grimoire.validation.validateAll, 'function');
	});
});
