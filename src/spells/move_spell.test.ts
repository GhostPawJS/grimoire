import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { moveSpell } from './move_spell.ts';

describe('moveSpell', () => {
	it('moves spell to new path', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'migrating' }] }],
		});
		try {
			const result = moveSpell(root, 'general/migrating', 'engineering/migrating');
			assert.equal(result.from, 'general/migrating');
			assert.equal(result.to, 'engineering/migrating');
			assert.ok(!existsSync(join(root, 'general', 'migrating')));
			assert.ok(existsSync(join(root, 'engineering', 'migrating', 'SKILL.md')));
		} finally {
			cleanup();
		}
	});

	it('preserves SKILL.md content after move', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'mover' }] }],
		});
		try {
			const before = readFileSync(join(root, 'general', 'mover', 'SKILL.md'), 'utf-8');
			moveSpell(root, 'general/mover', 'ops/mover');
			const after = readFileSync(join(root, 'ops', 'mover', 'SKILL.md'), 'utf-8');
			assert.equal(after, before);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError for missing source', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(() => moveSpell(root, 'general/ghost', 'ops/ghost'), GrimoireNotFoundError);
		} finally {
			cleanup();
		}
	});
});
