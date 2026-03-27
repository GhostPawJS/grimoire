import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VirtualSpellStore } from './virtual_spell_store.ts';

describe('VirtualSpellStore', () => {
	it('set/get/has/delete lifecycle', () => {
		const s = new VirtualSpellStore();
		s.set('ch/spell', 'content');
		assert.equal(s.has('ch/spell'), true);
		assert.equal(s.get('ch/spell'), 'content');
		assert.equal(s.delete('ch/spell'), true);
		assert.equal(s.has('ch/spell'), false);
		assert.equal(s.delete('ch/spell'), false);
	});

	it('clear removes everything', () => {
		const s = new VirtualSpellStore();
		s.set('a/b', '1');
		s.set('c/d', '2');
		s.clear();
		assert.equal(s.listPaths().length, 0);
	});

	it('listPaths excludes shelved', () => {
		const s = new VirtualSpellStore();
		s.set('ch/a', '1');
		s.set('.shelved/ch/b', '2');
		assert.deepEqual(s.listPaths(), ['ch/a']);
	});

	it('discoverSpells ignores pathless entries', () => {
		const s = new VirtualSpellStore();
		s.set('noslash', '1');
		s.set('ch/spell', '2');
		const d = s.discoverSpells();
		assert.equal(d.length, 1);
		assert.equal(d[0]?.name, 'spell');
		assert.equal(d[0]?.chapter, 'ch');
	});

	it('listChapters returns sorted unique chapters', () => {
		const s = new VirtualSpellStore();
		s.set('beta/x', '1');
		s.set('alpha/y', '2');
		s.set('alpha/z', '3');
		assert.deepEqual(s.listChapters(), ['alpha', 'beta']);
	});

	it('shelve moves to .shelved/ prefix', () => {
		const s = new VirtualSpellStore();
		s.set('ch/x', 'content');
		const key = s.shelve('ch/x');
		assert.equal(key, '.shelved/ch/x');
		assert.equal(s.has('ch/x'), false);
		assert.equal(s.get('.shelved/ch/x'), 'content');
	});

	it('shelve throws for missing spell', () => {
		const s = new VirtualSpellStore();
		assert.throws(() => s.shelve('no/spell'));
	});

	it('unshelve restores spell', () => {
		const s = new VirtualSpellStore();
		s.set('ch/x', 'content');
		s.shelve('ch/x');
		const restored = s.unshelve('ch/x');
		assert.equal(restored, 'ch/x');
		assert.equal(s.get('ch/x'), 'content');
		assert.equal(s.has('.shelved/ch/x'), false);
	});

	it('unshelve throws for missing shelved spell', () => {
		const s = new VirtualSpellStore();
		assert.throws(() => s.unshelve('nope'));
	});

	it('moveSpell changes chapter', () => {
		const s = new VirtualSpellStore();
		s.set('old/spell', 'data');
		const np = s.moveSpell('old/spell', 'new');
		assert.equal(np, 'new/spell');
		assert.equal(s.has('old/spell'), false);
		assert.equal(s.get('new/spell'), 'data');
	});

	it('moveSpell throws for invalid path', () => {
		const s = new VirtualSpellStore();
		assert.throws(() => s.moveSpell('noslash', 'ch'));
	});

	it('moveSpell throws for missing spell', () => {
		const s = new VirtualSpellStore();
		assert.throws(() => s.moveSpell('ch/missing', 'new'));
	});

	it('seed populates from array', () => {
		const s = new VirtualSpellStore();
		s.seed([
			{ path: 'a/b', content: '1' },
			{ path: 'c/d', content: '2' },
		]);
		assert.equal(s.get('a/b'), '1');
		assert.equal(s.get('c/d'), '2');
	});
});
