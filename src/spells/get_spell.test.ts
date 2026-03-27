import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError } from '../errors.ts';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { getSpell } from './get_spell.ts';

describe('getSpell', () => {
	it('returns a full spell record', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			const spell = getSpell(root, 'general/writing');
			assert.equal(spell.name, 'writing');
			assert.equal(spell.chapter, 'general');
			assert.equal(spell.path, 'general/writing');
			assert.ok(spell.absolutePath.endsWith('general/writing'));
			assert.ok(spell.skillMdPath.endsWith('SKILL.md'));
			assert.equal(spell.tier, 'Uncheckpointed');
			assert.equal(spell.rank, 0);
			assert.ok(spell.frontmatter.name === 'writing');
			assert.ok(spell.body.length > 0);
		} finally {
			cleanup();
		}
	});

	it('logs read event when db is provided', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		const db = createTestDb();
		try {
			getSpell(root, 'general/writing', db);
			const row = db
				.prepare('SELECT * FROM spell_events WHERE spell = ? AND event = ?')
				.get<{ spell: string; event: string }>('general/writing', 'read');
			assert.ok(row);
			assert.equal(row.spell, 'general/writing');
			assert.equal(row.event, 'read');
		} finally {
			db.close();
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError for missing spell', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(() => getSpell(root, 'general/nonexistent'), GrimoireNotFoundError);
		} finally {
			cleanup();
		}
	});
});
