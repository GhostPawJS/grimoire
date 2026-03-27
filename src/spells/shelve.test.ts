import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { shelve } from './shelve.ts';

describe('shelve', () => {
	it('moves spell to .shelved directory', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'archive-me' }] }],
		});
		try {
			const result = shelve(root, 'general/archive-me');
			assert.equal(result.path, '.shelved/general/archive-me');
			assert.ok(existsSync(join(root, '.shelved', 'general', 'archive-me', 'SKILL.md')));
			assert.ok(!existsSync(join(root, 'general', 'archive-me')));
		} finally {
			cleanup();
		}
	});

	it('preserves SKILL.md content in shelved location', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'keeper' }] }],
		});
		try {
			const before = readFileSync(join(root, 'general', 'keeper', 'SKILL.md'), 'utf-8');
			shelve(root, 'general/keeper');
			const after = readFileSync(join(root, '.shelved', 'general', 'keeper', 'SKILL.md'), 'utf-8');
			assert.equal(after, before);
		} finally {
			cleanup();
		}
	});
});
