import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateSkillMd } from './validate_skill_md.ts';

function makeSkillMd(
	overrides: Record<string, string> = {},
	body = 'This is the body content.',
): string {
	const fields = {
		name: 'my-skill',
		description: 'A cool skill',
		...overrides,
	};
	const frontmatter = Object.entries(fields)
		.map(([k, v]) => `${k}: ${v}`)
		.join('\n');
	return `---\n${frontmatter}\n---\n\n${body}`;
}

describe('validateSkillMd', () => {
	it('accepts valid content', () => {
		const result = validateSkillMd(makeSkillMd());
		assert.equal(result.valid, true);
		assert.equal(result.errors.length, 0);
	});

	it('rejects missing name', () => {
		const content = '---\ndescription: desc\n---\n\nBody.';
		const result = validateSkillMd(content);
		assert.equal(result.valid, false);
		assert.ok(result.errors.some((e) => e.includes('name')));
	});

	it('rejects invalid name format', () => {
		const result = validateSkillMd(makeSkillMd({ name: 'Invalid Name!' }));
		assert.equal(result.valid, false);
		assert.ok(result.errors.some((e) => e.includes('name must match')));
	});

	it('rejects name longer than 64 characters', () => {
		const longName = 'a'.repeat(65);
		const result = validateSkillMd(makeSkillMd({ name: longName }));
		assert.equal(result.valid, false);
		assert.ok(result.errors.some((e) => e.includes('at most 64')));
	});

	it('rejects description longer than 1024 characters', () => {
		const longDesc = 'a'.repeat(1025);
		const result = validateSkillMd(makeSkillMd({ description: longDesc }));
		assert.equal(result.valid, false);
		assert.ok(result.errors.some((e) => e.includes('at most 1024')));
	});

	it('rejects empty body', () => {
		const result = validateSkillMd(makeSkillMd({}, ''));
		assert.equal(result.valid, false);
		assert.ok(result.errors.some((e) => e.includes('body')));
	});

	it('warns on body exceeding 500 lines', () => {
		const longBody = Array.from({ length: 501 }, (_, i) => `Line ${i + 1}`).join('\n');
		const result = validateSkillMd(makeSkillMd({}, longBody));
		assert.ok(result.warnings.some((w) => w.includes('500 lines')));
	});

	it('warns on unknown frontmatter fields', () => {
		const result = validateSkillMd(makeSkillMd({ 'custom-field': 'value' }));
		assert.ok(result.warnings.some((w) => w.includes('unknown frontmatter field')));
	});

	it('does not warn on known hyphenated fields', () => {
		const result = validateSkillMd(makeSkillMd({ 'allowed-tools': 'tool1' }));
		assert.ok(!result.warnings.some((w) => w.includes('unknown')));
	});
});
