import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSkillMd } from './parse_skill_md.ts';
import { serializeSkillMd } from './serialize_skill_md.ts';

describe('serializeSkillMd', () => {
	it('produces valid SKILL.md output', () => {
		const result = serializeSkillMd(
			{ name: 'my-skill', description: 'A cool skill' },
			'Body content here.',
		);
		assert.ok(result.startsWith('---\n'));
		assert.ok(result.includes('name: my-skill'));
		assert.ok(result.includes('description: A cool skill'));
		assert.ok(result.includes('Body content here.'));
	});

	it('round-trips through parse and serialize', () => {
		const original = { name: 'test-skill', description: 'Test description' };
		const body = 'Some body text.';
		const serialized = serializeSkillMd(original, body);
		const parsed = parseSkillMd(serialized);

		assert.equal(parsed.ok, true);
		if (!parsed.ok) return;
		assert.equal(parsed.frontmatter.name, original.name);
		assert.equal(parsed.frontmatter.description, original.description);
		assert.equal(parsed.body.trim(), body);
	});

	it('includes all optional fields', () => {
		const result = serializeSkillMd(
			{
				name: 'my-skill',
				description: 'desc',
				license: 'MIT',
				compatibility: 'cursor >=0.50',
				allowedTools: 'tool1 tool2',
				disableModelInvocation: true,
			},
			'Body.',
		);
		assert.ok(result.includes('license: MIT'));
		assert.ok(result.includes('compatibility: cursor >=0.50'));
		assert.ok(result.includes('allowed-tools: tool1 tool2'));
		assert.ok(result.includes('disable-model-invocation: true'));
	});

	it('serializes metadata as nested YAML', () => {
		const result = serializeSkillMd(
			{
				name: 'my-skill',
				description: 'desc',
				metadata: { source: 'github', version: '1.0' },
			},
			'Body.',
		);
		assert.ok(result.includes('metadata:'));
		assert.ok(result.includes('  source: github'));
		assert.ok(result.includes('  version: 1.0'));
	});

	it('converts camelCase to hyphenated for allowed-tools', () => {
		const result = serializeSkillMd({ name: 'x', description: 'y', allowedTools: 'abc' }, 'Body.');
		assert.ok(result.includes('allowed-tools: abc'));
		assert.ok(!result.includes('allowedTools'));
	});

	it('converts camelCase to hyphenated for disable-model-invocation', () => {
		const result = serializeSkillMd(
			{ name: 'x', description: 'y', disableModelInvocation: false },
			'Body.',
		);
		assert.ok(result.includes('disable-model-invocation: false'));
		assert.ok(!result.includes('disableModelInvocation'));
	});
});
