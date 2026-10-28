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

it('gives newly sealed spells fourteen days before dormancy and expires pending evidence by age and cap', () => {
	const db = createTestDb();
	const { root, cleanup } = createTestRoot({
		chapters: [{ name: 'ops', spells: [{ name: 'fresh' }] }],
	});
	const now = Date.UTC(2026, 9, 28);
	try {
		logEvent(db, { spell: 'ops/fresh', event: 'seal', now });
		for (let i = 0; i < 61; i++)
			db.prepare(
				"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('practice', ?, 'pending', ?)",
			).run(`Evidence ${i}`, now - 1000 + i);
		db.prepare(
			"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('practice', 'Old evidence', 'pending', ?)",
		).run(now - 91 * 86_400_000);
		const snapshot = catalogue(root, db, { now });
		assert.deepEqual(snapshot.dormantSpells, []);
		assert.equal(snapshot.spellHealth['ops/fresh'], 0);
		assert.equal(snapshot.pendingNotes, 50);
		assert.equal(
			db
				.prepare("SELECT COUNT(*) AS count FROM spell_notes WHERE status = 'expired'")
				.get<{ count: number }>()?.count,
			12,
		);
		assert.equal(
			db.prepare('SELECT status FROM spell_notes WHERE id = 1').get<{ status: string }>()?.status,
			'expired',
		);
		assert.deepEqual(catalogue(root, db, { now: now + 14 * 86_400_000 }).dormantSpells, [
			'ops/fresh',
		]);
	} finally {
		db.close();
		cleanup();
	}
});

it('reports note cap expiry and keeps future projections out of stored health and notes', () => {
	const db = createTestDb();
	const { root, cleanup } = createTestRoot();
	try {
		const now = Date.now();
		const insert = db.prepare(
			"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('test', 'pending evidence', 'pending', ?)",
		);
		for (let i = 0; i < 55; i++) insert.run(now);
		const current = catalogue(root, db, { now });
		assert.equal(current.pendingNotes, 50);
		assert.ok(
			current.warnings?.some(
				(warning) => warning.code === 'notes_expired' && warning.message.startsWith('5 '),
			),
		);
		const before = db.prepare('SELECT * FROM spell_notes ORDER BY id').all();
		const future = catalogue(root, db, { now: now + 100 * 86_400_000 });
		assert.equal(future.pendingNotes, 0);
		assert.ok(future.warnings?.some((warning) => warning.code === 'projected'));
		assert.deepEqual(db.prepare('SELECT * FROM spell_notes ORDER BY id').all(), before);
		assert.equal(
			db.prepare('SELECT COUNT(*) AS n FROM grimoire_health').get<{ n: number }>()?.n,
			1,
		);
		assert.equal(
			db.prepare('SELECT computed_at FROM grimoire_health').get<{ computed_at: string }>()
				?.computed_at,
			current.computedAt,
		);
	} finally {
		db.close();
		cleanup();
	}
});
