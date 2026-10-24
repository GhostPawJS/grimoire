import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError, GrimoireValidationError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { readCatalogue } from '../health/read_catalogue.ts';
import { createTestDb } from '../lib/test-db.ts';
import { dropNote } from '../notes/drop_note.ts';
import {
	demoBuildIndex,
	demoCatalogue,
	demoDeleteSpell,
	demoGetSpell,
	demoInscribe,
} from './demo_operations.ts';
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

describe('demo index and catalogue', () => {
	it('sorts and filters valid index entries while ignoring empty or malformed content', () => {
		const store = new VirtualSpellStore();
		store.seed([
			{ path: 'z/b', content: skill('b') },
			{ path: 'a/c', content: skill('c') },
			{ path: 'a/empty', content: '' },
			{ path: 'a/bad', content: 'invalid' },
		]);
		assert.deepEqual(
			demoBuildIndex(store).map((e) => e.path),
			['a/c', 'z/b'],
		);
		assert.deepEqual(
			demoBuildIndex(store, { chapters: ['z'] }).map((e) => e.path),
			['z/b'],
		);
		assert.throws(() => demoGetSpell(store, 'a/bad'), GrimoireNotFoundError);
	});

	it('logs inscription and reads and reports duplicate descriptions', () => {
		const db = createTestDb();
		try {
			const store = new VirtualSpellStore();
			store.set('general/empty', '');
			store.set('general/bad', 'invalid');
			demoInscribe(store, db, { name: 'one', content: skill('one'), now: 100 });
			const result = demoInscribe(store, db, { name: 'two', content: skill('two'), now: 200 });
			assert.deepEqual(result.warnings, [{ existingPath: 'general/one', similarity: 1 }]);
			demoGetSpell(store, 'general/two', db);
			assert.deepEqual(db.prepare('SELECT event FROM spell_events ORDER BY id').all(), [
				{ event: 'inscribe' },
				{ event: 'inscribe' },
				{ event: 'read' },
			]);
		} finally {
			db.close();
		}
	});

	it('persists catalogue health, note loads and activity for populated and empty stores', () => {
		const db = createTestDb();
		try {
			const store = new VirtualSpellStore();
			const now = 200 * 86400000;
			store.set('general/old', skill('old', 'A test spell.', 'one\ntwo\nthree'));
			store.set('general/new', skill('new'));
			store.set('other/empty', '');
			store.set('other/bad', 'invalid');
			logEvent(db, { spell: 'general/old', event: 'seal', now: 0 });
			logEvent(db, { spell: 'general/old', event: 'seal', now: 1000 });
			logEvent(db, { spell: 'general/old', event: 'read', now });
			dropNote(db, { source: 'practice', content: 'A test spell.', domain: 'general/old', now });
			const snapshot = demoCatalogue(store, db, {
				now,
				staleDays: 1,
				dormantDays: 1,
				oversizeLines: 1,
			});
			assert.equal(snapshot.totalSpells, 4);
			assert.deepEqual(snapshot.chapterDistribution, { general: 2, other: 2 });
			assert.ok(snapshot.staleSpells.includes('general/old'));
			assert.ok(snapshot.dormantSpells.includes('general/new'));
			assert.ok(snapshot.oversizedSpells.includes('general/old'));
			assert.equal(snapshot.pendingNotes, 1);
			assert.deepEqual(readCatalogue(db), snapshot);
			store.clear();
			assert.equal(demoCatalogue(store, db).totalSpells, 0);
		} finally {
			db.close();
		}
	});
});
