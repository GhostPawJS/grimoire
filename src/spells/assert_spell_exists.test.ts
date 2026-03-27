import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

describe('assertSpellExists', () => {
	it('does not throw for a valid spell path', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			assert.doesNotThrow(() => assertSpellExists(root, 'general/writing'));
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError for missing directory', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(() => assertSpellExists(root, 'general/nonexistent'), GrimoireNotFoundError);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError when SKILL.md is missing', () => {
		const { root, cleanup } = createTestRoot();
		try {
			mkdirSync(join(root, 'general', 'no-skill'), { recursive: true });
			assert.throws(() => assertSpellExists(root, 'general/no-skill'), GrimoireNotFoundError);
		} finally {
			cleanup();
		}
	});
});
