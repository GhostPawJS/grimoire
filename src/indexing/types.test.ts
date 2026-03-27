import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { IndexEntry, IndexOptions } from './types.ts';

describe('indexing types', () => {
	it('IndexEntry is structurally valid', () => {
		const entry: IndexEntry = {
			path: 'chapter/spell',
			chapter: 'chapter',
			name: 'spell',
			tier: 'Apprentice',
			rank: 1,
			description: 'A test spell',
		};
		assert.equal(entry.tier, 'Apprentice');
	});

	it('IndexOptions accepts empty object', () => {
		const opts: IndexOptions = {};
		assert.equal(opts.chapters, undefined);
	});

	it('IndexOptions accepts chapters filter', () => {
		const opts: IndexOptions = { chapters: ['core', 'advanced'] };
		assert.deepEqual(opts.chapters, ['core', 'advanced']);
	});
});
