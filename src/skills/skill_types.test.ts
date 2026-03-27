import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defineGrimoireSkill } from './skill_types.ts';

describe('skill_types', () => {
	it('defineGrimoireSkill returns the same object reference', () => {
		const skill = { name: 'test-skill', description: 'A test.', content: '# Test' };
		const defined = defineGrimoireSkill(skill);
		strictEqual(defined, skill);
	});

	it('preserves all fields', () => {
		const defined = defineGrimoireSkill({
			name: 'foo-bar',
			description: 'Desc.',
			content: '# Foo\n\nContent here.',
		});
		strictEqual(defined.name, 'foo-bar');
		strictEqual(defined.description, 'Desc.');
		strictEqual(defined.content.startsWith('# Foo'), true);
	});
});
