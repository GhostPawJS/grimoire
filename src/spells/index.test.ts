import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as spells from './index.ts';

describe('spells index exports', () => {
	it('exports public functions', () => {
		assert.equal(typeof spells.deleteSpell, 'function');
		assert.equal(typeof spells.getContent, 'function');
		assert.equal(typeof spells.getSpell, 'function');
		assert.equal(typeof spells.inscribe, 'function');
		assert.equal(typeof spells.listChapters, 'function');
		assert.equal(typeof spells.listSpells, 'function');
		assert.equal(typeof spells.moveSpell, 'function');
		assert.equal(typeof spells.renderContent, 'function');
		assert.equal(typeof spells.repair, 'function');
		assert.equal(typeof spells.repairAll, 'function');
		assert.equal(typeof spells.shelve, 'function');
		assert.equal(typeof spells.unshelve, 'function');
	});
});
