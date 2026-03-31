import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { catalogueReadiness } from './catalogue_readiness.ts';
import { saveCatalogue } from './save_catalogue.ts';
import type { SaveCatalogueInput } from './types.ts';

const BASE_TIME = new Date('2026-01-01T00:00:00.000Z').getTime();
const AFTER_TIME = BASE_TIME + 60_000;

function insertHealth(db: ReturnType<typeof createTestDb>, computedAt: string): void {
	const input: SaveCatalogueInput = {
		computedAt,
		totalSpells: 1,
		chapterDistribution: {},
		rankDistribution: {},
		staleSpells: [],
		dormantSpells: [],
		oversizedSpells: [],
		pendingNotes: 0,
		notesRouted: 0,
		orphanClusters: [],
		draftsQueued: 0,
		chapterBalance: {},
		spellHealth: {},
		sealVelocity: {},
	};
	saveCatalogue(db, input);
}

function insertNote(db: ReturnType<typeof createTestDb>, createdAt: number): void {
	db.prepare(
		"INSERT INTO spell_notes (source, content, status, created_at) VALUES ('test', 'obs', 'pending', ?)",
	).run(createdAt);
}

function insertEvent(db: ReturnType<typeof createTestDb>, ts: number): void {
	db.prepare("INSERT INTO spell_events (spell, event, ts) VALUES ('general/x', 'read', ?)").run(ts);
}

describe('catalogueReadiness', () => {
	it('returns no_prior_run when db has no health rows', () => {
		const db = createTestDb();
		const result = catalogueReadiness(db);
		assert.equal(result.ready, true);
		assert.equal(result.reason, 'no_prior_run');
		assert.equal(result.lastCatalogueAt, null);
		assert.equal(result.newNotesSince, 0);
		assert.equal(result.newEventsSince, 0);
		db.close();
	});

	it('returns idle when nothing new since last catalogue', () => {
		const db = createTestDb();
		const iso = new Date(BASE_TIME).toISOString();
		insertHealth(db, iso);
		const result = catalogueReadiness(db);
		assert.equal(result.ready, false);
		assert.equal(result.reason, 'idle');
		assert.equal(result.lastCatalogueAt, iso);
		assert.equal(result.newNotesSince, 0);
		assert.equal(result.newEventsSince, 0);
		db.close();
	});

	it('returns new_notes when pending notes were added after last catalogue', () => {
		const db = createTestDb();
		const iso = new Date(BASE_TIME).toISOString();
		insertHealth(db, iso);
		insertNote(db, AFTER_TIME);
		const result = catalogueReadiness(db);
		assert.equal(result.ready, true);
		assert.equal(result.reason, 'new_notes');
		assert.equal(result.lastCatalogueAt, iso);
		assert.equal(result.newNotesSince, 1);
		db.close();
	});

	it('returns new_events when spell events were recorded after last catalogue', () => {
		const db = createTestDb();
		const iso = new Date(BASE_TIME).toISOString();
		insertHealth(db, iso);
		insertEvent(db, AFTER_TIME);
		const result = catalogueReadiness(db);
		assert.equal(result.ready, true);
		assert.equal(result.reason, 'new_events');
		assert.equal(result.lastCatalogueAt, iso);
		assert.equal(result.newNotesSince, 0);
		assert.equal(result.newEventsSince, 1);
		db.close();
	});

	it('prefers new_notes over new_events when both exist', () => {
		const db = createTestDb();
		const iso = new Date(BASE_TIME).toISOString();
		insertHealth(db, iso);
		insertNote(db, AFTER_TIME);
		insertEvent(db, AFTER_TIME);
		const result = catalogueReadiness(db);
		assert.equal(result.reason, 'new_notes');
		assert.equal(result.newNotesSince, 1);
		assert.equal(result.newEventsSince, 1);
		db.close();
	});

	it('ignores notes and events at or before the catalogue timestamp', () => {
		const db = createTestDb();
		const iso = new Date(BASE_TIME).toISOString();
		insertHealth(db, iso);
		insertNote(db, BASE_TIME); // exactly at catalogue time — not after
		insertEvent(db, BASE_TIME - 1); // before catalogue time
		const result = catalogueReadiness(db);
		assert.equal(result.ready, false);
		assert.equal(result.reason, 'idle');
		db.close();
	});

	it('uses the most recent catalogue row when multiple exist', () => {
		const db = createTestDb();
		const older = new Date(BASE_TIME - 120_000).toISOString();
		const newer = new Date(BASE_TIME).toISOString();
		insertHealth(db, older);
		insertHealth(db, newer);
		// note added between older and newer — after older but not after newer
		insertNote(db, BASE_TIME - 60_000);
		const result = catalogueReadiness(db);
		assert.equal(result.ready, false);
		assert.equal(result.reason, 'idle');
		db.close();
	});
});
