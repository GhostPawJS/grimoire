import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SkillMdFrontmatter, SkillMdParseResult, SkillMdValidationResult } from './types.ts';

describe('spec/types', () => {
	it('SkillMdFrontmatter is importable', () => {
		const sample: SkillMdFrontmatter = {
			name: 'test',
			description: 'A test skill',
		};
		assert.ok(sample !== undefined);
	});

	it('SkillMdValidationResult is importable', () => {
		const sample: SkillMdValidationResult = {
			valid: true,
			errors: [],
			warnings: [],
		};
		assert.ok(sample !== undefined);
	});

	it('SkillMdParseResult ok branch is importable', () => {
		const sample: SkillMdParseResult = {
			ok: true,
			frontmatter: { name: 'x', description: 'y' },
			body: '',
		};
		assert.ok(sample !== undefined);
	});

	it('SkillMdParseResult error branch is importable', () => {
		const sample: SkillMdParseResult = {
			ok: false,
			error: 'bad',
		};
		assert.ok(sample !== undefined);
	});
});
