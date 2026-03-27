import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSkillMd } from './parse_skill_md.ts';

describe('parseSkillMd', () => {
	it('parses a valid SKILL.md', () => {
		const content = [
			'---',
			'name: my-skill',
			'description: A cool skill',
			'---',
			'',
			'This is the body.',
		].join('\n');
		const result = parseSkillMd(content);
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.frontmatter.name, 'my-skill');
		assert.equal(result.frontmatter.description, 'A cool skill');
		assert.ok(result.body.includes('This is the body.'));
	});

	it('returns error for missing frontmatter delimiters', () => {
		const result = parseSkillMd('no delimiters here');
		assert.equal(result.ok, false);
		if (result.ok) return;
		assert.ok(result.error.includes('Missing opening'));
	});

	it('returns error for missing closing delimiter', () => {
		const result = parseSkillMd('---\nname: test\nno closing');
		assert.equal(result.ok, false);
		if (result.ok) return;
		assert.ok(result.error.includes('Missing closing'));
	});

	it('handles empty body', () => {
		const content = '---\nname: test\ndescription: desc\n---\n';
		const result = parseSkillMd(content);
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.equal(result.body, '');
	});

	it('handles extra --- in body content', () => {
		const content = [
			'---',
			'name: test',
			'description: desc',
			'---',
			'',
			'Some text',
			'---',
			'More text after triple dash',
		].join('\n');
		const result = parseSkillMd(content);
		assert.equal(result.ok, true);
		if (!result.ok) return;
		assert.ok(result.body.includes('---'));
		assert.ok(result.body.includes('More text after triple dash'));
	});

	it('returns error for empty frontmatter', () => {
		const result = parseSkillMd('---\n---\nbody');
		assert.equal(result.ok, false);
		if (result.ok) return;
		assert.ok(result.error.includes('Empty frontmatter'));
	});
});
