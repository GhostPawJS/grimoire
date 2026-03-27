import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { deleteSpell } from './delete_spell.ts';

describe('deleteSpell', () => {
	it('deletes spell directory', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'doomed' }] }],
		});
		try {
			assert.ok(existsSync(join(root, 'general', 'doomed', 'SKILL.md')));
			deleteSpell(root, 'general/doomed');
			assert.ok(!existsSync(join(root, 'general', 'doomed')));
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError for missing spell', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(() => deleteSpell(root, 'general/nonexistent'), GrimoireNotFoundError);
		} finally {
			cleanup();
		}
	});
});
