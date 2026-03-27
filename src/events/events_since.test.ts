import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { eventsSince } from './events_since.ts';
import { logEvent } from './log_event.ts';

describe('eventsSince', () => {
	it('returns empty array when no events', () => {
		const db = createTestDb();
		assert.deepEqual(eventsSince(db, 0), []);
		db.close();
	});

	it('returns events at and after the given timestamp', () => {
		const db = createTestDb();
		logEvent(db, { spell: 'a', event: 'read', now: 10 });
		logEvent(db, { spell: 'b', event: 'seal', now: 20 });
		const list = eventsSince(db, 20);
		assert.equal(list.length, 1);
		assert.equal(list[0]?.spell, 'b');
		assert.equal(list[0]?.ts, 20);
		db.close();
	});

	it('does not return events before the timestamp', () => {
		const db = createTestDb();
		logEvent(db, { spell: 'early', event: 'read', now: 5 });
		logEvent(db, { spell: 'late', event: 'read', now: 15 });
		const list = eventsSince(db, 10);
		assert.equal(list.length, 1);
		assert.equal(list[0]?.spell, 'late');
		db.close();
	});
});
