import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SpellEventType } from './types.ts';

describe('events/types', () => {
	it('loads the module', () => {
		const sample: SpellEventType = 'read';
		assert.ok(sample !== undefined);
	});
});
