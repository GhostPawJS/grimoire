import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DraftStatus } from './types.ts';

describe('drafts/types', () => {
	it('loads the module', () => {
		const sample: DraftStatus = 'pending';
		assert.ok(sample !== undefined);
	});
});
