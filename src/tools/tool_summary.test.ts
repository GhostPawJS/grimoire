import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { summarizeCount, summarizeSpellAction } from './tool_summary.ts';

describe('summarizeCount', () => {
	it('returns singular for count of 1', () => {
		assert.equal(summarizeCount(1, 'spell'), 'Found 1 spell.');
	});

	it('returns plural for count of 0', () => {
		assert.equal(summarizeCount(0, 'spell'), 'Found 0 spells.');
	});

	it('returns plural for count > 1', () => {
		assert.equal(summarizeCount(5, 'spell'), 'Found 5 spells.');
	});

	it('uses custom plural', () => {
		assert.equal(summarizeCount(3, 'entry', 'entries'), 'Found 3 entries.');
	});
});

describe('summarizeSpellAction', () => {
	it('capitalizes the action and formats path', () => {
		assert.equal(summarizeSpellAction('shelve', 'ch/spell'), 'Shelve spell `ch/spell`.');
	});

	it('handles single-char action', () => {
		assert.equal(summarizeSpellAction('x', 'p'), 'X spell `p`.');
	});
});
