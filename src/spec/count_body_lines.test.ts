import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countBodyLines } from './count_body_lines.ts';

describe('countBodyLines', () => {
	it('counts body lines of valid SKILL.md', () => {
		const content = '---\nname: test\ndescription: desc\n---\nLine 1\nLine 2\nLine 3';
		assert.equal(countBodyLines(content), 3);
	});

	it('falls back to total lines when parsing fails', () => {
		const content = 'no frontmatter\njust lines\nthree total';
		assert.equal(countBodyLines(content), 3);
	});

	it('returns 1 for empty body', () => {
		const content = '---\nname: test\ndescription: desc\n---\n';
		assert.equal(countBodyLines(content), 1);
	});
});
