import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from './test-db.ts';

const EXPECTED_TABLES = [
	'spell_events',
	'spell_notes',
	'grimoire_health',
	'spell_drafts',
	'spell_provenance',
	'scout_index',
];

describe('createTestDb', () => {
	it('returns a database with all grimoire tables initialized', () => {
		const db = createTestDb();
		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
			.all<{ name: string }>();
		const tableNames = tables.map((t) => t.name);

		for (const expected of EXPECTED_TABLES) {
			assert.ok(tableNames.includes(expected), `missing table: ${expected}`);
		}
		db.close();
	});

	it('allows inserting into an entity table', () => {
		const db = createTestDb();
		db.prepare('INSERT INTO spell_events (spell, event, ts) VALUES (?, ?, ?)').run(
			'test/spell',
			'read',
			1000,
		);

		const row = db
			.prepare('SELECT spell, event FROM spell_events WHERE id = 1')
			.get<{ spell: string; event: string }>();
		assert.deepEqual(row, { spell: 'test/spell', event: 'read' });
		db.close();
	});
});
