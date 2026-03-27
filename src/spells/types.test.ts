import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Spell, SpellFiles } from './types.ts';

describe('spells/types', () => {
	it('loads the module', () => {
		const files: SpellFiles = { scripts: [], references: [], assets: [] };
		assert.ok(files !== undefined);
	});

	it('spell type has expected shape', () => {
		const spell: Spell = {
			name: 'test',
			chapter: 'general',
			path: 'general/test',
			absolutePath: '/tmp/general/test',
			skillMdPath: '/tmp/general/test/SKILL.md',
			description: 'A test spell',
			body: '# Test',
			bodyLines: 1,
			rank: 0,
			tier: 'Uncheckpointed',
			files: { scripts: [], references: [], assets: [] },
			frontmatter: { name: 'test', description: 'A test spell' },
		};
		assert.equal(spell.name, 'test');
	});
});
