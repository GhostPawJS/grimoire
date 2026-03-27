import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapEventRow } from './map_event_row.ts';
import type { SpellEventRow } from './types.ts';

describe('mapEventRow', () => {
	it('maps all fields including null context_id', () => {
		const row: SpellEventRow = {
			id: 7,
			spell: 'lumos',
			event: 'read',
			context_id: null,
			ts: 1_700_000_000_000,
		};
		const ev = mapEventRow(row);
		assert.equal(ev.id, 7);
		assert.equal(ev.spell, 'lumos');
		assert.equal(ev.event, 'read');
		assert.equal(ev.contextId, null);
		assert.equal(ev.ts, 1_700_000_000_000);
	});

	it('maps context_id to contextId when present', () => {
		const row: SpellEventRow = {
			id: 2,
			spell: 'ward',
			event: 'move',
			context_id: 'ctx-1',
			ts: 500,
		};
		const ev = mapEventRow(row);
		assert.equal(ev.id, 2);
		assert.equal(ev.spell, 'ward');
		assert.equal(ev.event, 'move');
		assert.equal(ev.contextId, 'ctx-1');
		assert.equal(ev.ts, 500);
	});
});
