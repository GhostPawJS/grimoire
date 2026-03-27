import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	countBodyLines,
	normalizeFrontmatter,
	parseFrontmatterYaml,
	parseSkillMd,
	serializeSkillMd,
	validateSkillMd,
} from './index.ts';

describe('spec/index exports', () => {
	it('exports all functions', () => {
		assert.equal(typeof countBodyLines, 'function');
		assert.equal(typeof normalizeFrontmatter, 'function');
		assert.equal(typeof parseFrontmatterYaml, 'function');
		assert.equal(typeof parseSkillMd, 'function');
		assert.equal(typeof serializeSkillMd, 'function');
		assert.equal(typeof validateSkillMd, 'function');
	});
});
