import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as tools from './index.ts';

describe('tools barrel', () => {
	it('exports all 10 tool definitions', () => {
		assert.ok(tools.searchGrimoireTool);
		assert.ok(tools.reviewGrimoireTool);
		assert.ok(tools.inspectGrimoireItemTool);
		assert.ok(tools.inscribeSpellTool);
		assert.ok(tools.honeSpellTool);
		assert.ok(tools.manageSpellTool);
		assert.ok(tools.dropNoteTool);
		assert.ok(tools.manageDraftTool);
		assert.ok(tools.runCatalogueTool);
		assert.ok(tools.scoutSkillsTool);
	});

	it('exports constructor functions', () => {
		assert.equal(typeof tools.toolSuccess, 'function');
		assert.equal(typeof tools.toolNoOp, 'function');
		assert.equal(typeof tools.toolFailure, 'function');
		assert.equal(typeof tools.toolNeedsClarification, 'function');
		assert.equal(typeof tools.toolWarning, 'function');
	});

	it('exports schema helpers', () => {
		assert.equal(typeof tools.stringSchema, 'function');
		assert.equal(typeof tools.objectSchema, 'function');
		assert.equal(typeof tools.oneOfSchema, 'function');
		assert.equal(typeof tools.defineGrimoireTool, 'function');
	});

	it('exports registry functions', () => {
		assert.equal(typeof tools.grimoireTools, 'object');
		assert.equal(typeof tools.listGrimoireToolDefinitions, 'function');
		assert.equal(typeof tools.getGrimoireToolByName, 'function');
	});

	it('exports mapping', () => {
		assert.ok(Array.isArray(tools.toolMapping));
		assert.ok(tools.toolMapping.length > 0);
	});

	it('exports all 10 tool name constants', () => {
		assert.equal(typeof tools.searchGrimoireToolName, 'string');
		assert.equal(typeof tools.reviewGrimoireToolName, 'string');
		assert.equal(typeof tools.inspectGrimoireItemToolName, 'string');
		assert.equal(typeof tools.inscribeSpellToolName, 'string');
		assert.equal(typeof tools.honeSpellToolName, 'string');
		assert.equal(typeof tools.manageSpellToolName, 'string');
		assert.equal(typeof tools.dropNoteToolName, 'string');
		assert.equal(typeof tools.manageDraftToolName, 'string');
		assert.equal(typeof tools.runCatalogueToolName, 'string');
		assert.equal(typeof tools.scoutSkillsToolName, 'string');
	});

	it('exports next-step hint constructors', () => {
		assert.equal(typeof tools.inspectSpellNext, 'function');
		assert.equal(typeof tools.reviewViewNext, 'function');
		assert.equal(typeof tools.honeNext, 'function');
		assert.equal(typeof tools.searchNext, 'function');
		assert.equal(typeof tools.catalogueNext, 'function');
		assert.equal(typeof tools.manageSpellNext, 'function');
		assert.equal(typeof tools.useToolNext, 'function');
		assert.equal(typeof tools.askUserNext, 'function');
		assert.equal(typeof tools.retryNext, 'function');
	});

	it('exports entity ref constructors', () => {
		assert.equal(typeof tools.toSpellRef, 'function');
		assert.equal(typeof tools.toSpellPathRef, 'function');
		assert.equal(typeof tools.toNoteRef, 'function');
		assert.equal(typeof tools.toDraftRef, 'function');
		assert.equal(typeof tools.toProvenanceRef, 'function');
		assert.equal(typeof tools.toIndexEntryRef, 'function');
	});

	it('exports error handling', () => {
		assert.equal(typeof tools.translateToolError, 'function');
		assert.equal(typeof tools.withToolHandling, 'function');
	});

	it('exports summary helpers', () => {
		assert.equal(typeof tools.summarizeCount, 'function');
		assert.equal(typeof tools.summarizeSpellAction, 'function');
	});
});
