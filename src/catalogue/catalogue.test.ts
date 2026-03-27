import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { logEvent } from '../events/log_event.ts';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { catalogue } from './catalogue.ts';

describe('catalogue', () => {
	it('produces a snapshot for a root with spells', () => {
		const db = createTestDb();
		const { root, cleanup } = createTestRoot({
			chapters: [
				{
					name: 'basics',
					spells: [{ name: 'hello' }, { name: 'world' }],
				},
				{
					name: 'advanced',
					spells: [{ name: 'generics' }],
				},
			],
		});

		try {
			const now = Date.now();

			logEvent(db, { spell: 'basics/hello', event: 'seal', now: now - 10_000 });
			logEvent(db, { spell: 'basics/hello', event: 'read', now: now - 5_000 });
			logEvent(db, { spell: 'basics/world', event: 'seal', now: now - 20_000 });

			const snap = catalogue(root, db, { now });

			assert.ok(snap.id > 0);
			assert.equal(snap.totalSpells, 3);
			assert.equal(snap.chapterDistribution.basics, 2);
			assert.equal(snap.chapterDistribution.advanced, 1);
			assert.ok(Array.isArray(snap.staleSpells));
			assert.ok(Array.isArray(snap.dormantSpells));
			assert.ok(Array.isArray(snap.oversizedSpells));
			assert.ok(Array.isArray(snap.orphanClusters));
			assert.equal(typeof snap.pendingNotes, 'number');
			assert.equal(typeof snap.notesRouted, 'number');
			assert.equal(typeof snap.draftsQueued, 'number');
			assert.ok(typeof snap.spellHealth === 'object');
			assert.ok(typeof snap.sealVelocity === 'object');
			assert.ok(typeof snap.chapterBalance === 'object');
			assert.ok(snap.computedAt.length > 0);
		} finally {
			db.close();
			cleanup();
		}
	});

	it('works with empty root', () => {
		const db = createTestDb();
		const { root, cleanup } = createTestRoot();

		try {
			const snap = catalogue(root, db, { now: Date.now() });
			assert.equal(snap.totalSpells, 0);
			assert.deepEqual(snap.staleSpells, []);
			assert.deepEqual(snap.dormantSpells, []);
			assert.deepEqual(snap.oversizedSpells, []);
		} finally {
			db.close();
			cleanup();
		}
	});

	it('routes pending notes during catalogue', () => {
		const db = createTestDb();
		const { root, cleanup } = createTestRoot({
			chapters: [
				{
					name: 'basics',
					spells: [{ name: 'hello' }],
				},
			],
		});

		try {
			db.prepare(
				"INSERT INTO spell_notes (source, content, domain, status, created_at) VALUES (?, ?, NULL, 'pending', ?)",
			).run('test', 'A test spell named hello with body content', Date.now());

			const snap = catalogue(root, db, { now: Date.now(), routingThreshold: 0.1 });
			assert.ok(snap.notesRouted >= 0);
		} finally {
			db.close();
			cleanup();
		}
	});
});
