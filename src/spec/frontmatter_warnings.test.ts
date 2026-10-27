import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frontmatterWarnings } from './frontmatter_warnings.ts';
import { validateSkillMd } from './validate_skill_md.ts';

test('unsupported frontmatter is diagnosed while valid continuations and blocks are accepted', () => {
	for (const value of [
		'missing colon',
		'description: >2',
		'description: "unterminated',
		'metadata:\n  invalid',
	]) {
		assert.ok(frontmatterWarnings(value).length, value);
		assert.ok(
			validateSkillMd(`---\nname: example\ndescription: valid\n${value}\n---\nBody`).warnings
				.length,
			value,
		);
	}
	assert.deepEqual(frontmatterWarnings('description: >-\n  first\n  next\nlicense: MIT'), []);
	assert.deepEqual(frontmatterWarnings('description: "first\n  next"'), []);
});
