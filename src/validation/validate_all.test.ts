import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { validateAll } from './validate_all.ts';

describe('validateAll', () => {
	let root: string;
	let cleanup: () => void;

	beforeEach(() => {
		const result = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [{ name: 'spell-a' }, { name: 'spell-b' }],
				},
			],
		});
		root = result.root;
		cleanup = result.cleanup;
	});

	afterEach(() => {
		cleanup();
	});

	it('validates all spells in root', () => {
		const results = validateAll(root);
		assert.equal(results.length, 2);
		for (const result of results) {
			assert.equal(result.valid, true);
		}
	});

	it('returns empty for empty root', () => {
		const emptyRoot = createTestRoot();
		const results = validateAll(emptyRoot.root);
		assert.equal(results.length, 0);
		emptyRoot.cleanup();
	});
});
