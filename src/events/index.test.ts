import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { eventsSince, initEventTables, logEvent, mapEventRow } from './index.ts';

describe('events/index exports', () => {
	it('exports key functions', () => {
		assert.equal(typeof logEvent, 'function');
		assert.equal(typeof eventsSince, 'function');
		assert.equal(typeof initEventTables, 'function');
		assert.equal(typeof mapEventRow, 'function');
	});
});
