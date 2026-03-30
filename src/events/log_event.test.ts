import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { logEvent } from './log_event.ts';
import type { SpellEventRow } from './types.ts';

describe('logEvent', () => {
	it('returns incrementing ids', () => {
		const db = createTestDb();
		const a = logEvent(db, { spell: 's1', event: 'read', now: 100 });
		const b = logEvent(db, { spell: 's2', event: 'seal', now: 101 });
		assert.equal(a.id + 1, b.id);
		db.close();
	});

	it('inserted row can be read back', () => {
		const db = createTestDb();
		const { id } = logEvent(db, {
			spell: 'lumos',
			event: 'inscribe',
			contextId: 'c1',
			now: 2000,
		});
		const row = db
			.prepare('SELECT id, spell, event, context_id, ts FROM spell_events WHERE id = ?')
			.get<SpellEventRow>(id);
		assert.ok(row);
		assert.equal(row.spell, 'lumos');
		assert.equal(row.event, 'inscribe');
		assert.equal(row.context_id, 'c1');
		assert.equal(row.ts, 2000);
		db.close();
	});

	it('works without contextId', () => {
		const db = createTestDb();
		const { id } = logEvent(db, { spell: 'x', event: 'read', now: 3 });
		const row = db
			.prepare('SELECT context_id FROM spell_events WHERE id = ?')
			.get<{ context_id: string | null }>(id);
		assert.ok(row);
		assert.equal(row.context_id, null);
		db.close();
	});

	it('works with string contextId', () => {
		const db = createTestDb();
		const { id } = logEvent(db, { spell: 'y', event: 'hone', contextId: 'z', now: 4 });
		const row = db
			.prepare('SELECT context_id FROM spell_events WHERE id = ?')
			.get<{ context_id: string | null }>(id);
		assert.ok(row);
		assert.equal(row.context_id, 'z');
		db.close();
	});

	it('coerces numeric contextId to string', () => {
		const db = createTestDb();
		const { id } = logEvent(db, { spell: 'n', event: 'read', contextId: 42, now: 5 });
		const row = db
			.prepare('SELECT context_id FROM spell_events WHERE id = ?')
			.get<{ context_id: string | null }>(id);
		assert.ok(row);
		assert.equal(row.context_id, '42');
		db.close();
	});
});
