import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	dropNoteToolName,
	honeSpellToolName,
	inscribeSpellToolName,
	inspectGrimoireItemToolName,
	manageDraftToolName,
	manageSpellToolName,
	reviewGrimoireToolName,
	runCatalogueToolName,
	scoutSkillsToolName,
	searchGrimoireToolName,
} from './tool_names.ts';

const allNames = [
	searchGrimoireToolName,
	reviewGrimoireToolName,
	inspectGrimoireItemToolName,
	inscribeSpellToolName,
	honeSpellToolName,
	manageSpellToolName,
	dropNoteToolName,
	manageDraftToolName,
	runCatalogueToolName,
	scoutSkillsToolName,
];

describe('tool_names', () => {
	it('exports 10 distinct names', () => {
		assert.equal(allNames.length, 10);
		assert.equal(new Set(allNames).size, 10);
	});

	it('all names follow snake_case pattern', () => {
		for (const name of allNames) {
			assert.match(name, /^[a-z][a-z0-9_]*$/);
		}
	});

	it('all names are non-empty strings', () => {
		for (const name of allNames) {
			assert.equal(typeof name, 'string');
			assert.ok(name.length > 0);
		}
	});
});
