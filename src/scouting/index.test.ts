import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adoptSpell, adoptSpells, resolveSource } from './index.ts';

describe('scouting/index exports', () => {
	it('exports key functions', () => {
		assert.equal(typeof resolveSource, 'function');
		assert.equal(typeof adoptSpell, 'function');
		assert.equal(typeof adoptSpells, 'function');
	});
});
