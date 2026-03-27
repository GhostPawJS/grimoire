import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError, GrimoireValidationError } from '../errors.ts';
import { demoDeleteSpell, demoGetSpell, demoInscribe } from './demo_operations.ts';
import { VirtualSpellStore } from './virtual_spell_store.ts';

function skill(name: string, desc = 'A test spell.', body = '## When\n\nAlways.') {
	return `---\nname: ${name}\ndescription: ${desc}\n---\n\n${body}\n`;
}

describe('demoInscribe', () => {
	it('inscribes valid spell without db', () => {
		const store = new VirtualSpellStore();
		const r = demoInscribe(store, undefined, {
			name: 'test-spell',
			chapter: 'general',
			content: skill('test-spell'),
		});
		assert.equal(r.spell.name, 'test-spell');
		assert.equal(r.spell.chapter, 'general');
		assert.equal(r.spell.path, 'general/test-spell');
		assert.ok(store.has('general/test-spell'));
	});

	it('trims name and chapter whitespace', () => {
		const store = new VirtualSpellStore();
		const r = demoInscribe(store, undefined, {
			name: '  my-spell  ',
			chapter: '  dev  ',
			content: skill('my-spell'),
		});
		assert.equal(r.spell.path, 'dev/my-spell');
	});

	it('rejects empty name', () => {
		const store = new VirtualSpellStore();
		assert.throws(
			() => demoInscribe(store, undefined, { name: '  ', chapter: 'g', content: skill('x') }),
			GrimoireValidationError,
		);
	});

	it('rejects non-kebab-case name (spaces)', () => {
		const store = new VirtualSpellStore();
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'bad name',
					chapter: 'general',
					content: skill('bad name'),
				}),
			GrimoireValidationError,
		);
	});

	it('rejects non-kebab-case name (uppercase)', () => {
		const store = new VirtualSpellStore();
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'BadName',
					chapter: 'general',
					content: skill('BadName'),
				}),
			GrimoireValidationError,
		);
	});

	it('rejects chapter with slash', () => {
		const store = new VirtualSpellStore();
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'ok-spell',
					chapter: 'a/b',
					content: skill('ok-spell'),
				}),
			GrimoireValidationError,
		);
	});

	it('rejects empty chapter', () => {
		const store = new VirtualSpellStore();
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'ok-spell',
					chapter: '',
					content: skill('ok-spell'),
				}),
			GrimoireValidationError,
		);
	});

	it('rejects frontmatter name mismatch', () => {
		const store = new VirtualSpellStore();
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'other-name',
					chapter: 'general',
					content: skill('test-spell'),
				}),
			(e) => e instanceof GrimoireValidationError && e.message.includes('must match'),
		);
	});

	it('rejects duplicate spell path', () => {
		const store = new VirtualSpellStore();
		demoInscribe(store, undefined, {
			name: 'dup',
			chapter: 'general',
			content: skill('dup'),
		});
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'dup',
					chapter: 'general',
					content: skill('dup'),
				}),
			GrimoireValidationError,
		);
	});

	it('rejects invalid SKILL.md (empty body)', () => {
		const store = new VirtualSpellStore();
		const bad = '---\nname: no-body\ndescription: No body.\n---\n\n';
		assert.throws(
			() =>
				demoInscribe(store, undefined, {
					name: 'no-body',
					chapter: 'general',
					content: bad,
				}),
			GrimoireValidationError,
		);
	});
});

describe('demoGetSpell', () => {
	it('returns spell data', () => {
		const store = new VirtualSpellStore();
		store.set('dev/my-spell', skill('my-spell'));
		const s = demoGetSpell(store, 'dev/my-spell');
		assert.equal(s.name, 'my-spell');
		assert.equal(s.chapter, 'dev');
		assert.equal(s.description, 'A test spell.');
	});

	it('throws for missing path', () => {
		const store = new VirtualSpellStore();
		assert.throws(() => demoGetSpell(store, 'nope/missing'), GrimoireNotFoundError);
	});
});

describe('demoDeleteSpell', () => {
	it('deletes existing spell', () => {
		const store = new VirtualSpellStore();
		store.set('ch/x', skill('x'));
		demoDeleteSpell(store, 'ch/x');
		assert.equal(store.has('ch/x'), false);
	});

	it('throws for missing spell', () => {
		const store = new VirtualSpellStore();
		assert.throws(() => demoDeleteSpell(store, 'no/thing'), GrimoireNotFoundError);
	});
});
