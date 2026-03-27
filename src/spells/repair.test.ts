import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { repair } from './repair.ts';

describe('repair', () => {
	it('fixes name mismatch in frontmatter', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [
						{
							name: 'correct-name',
							content: `---\nname: wrong-name\ndescription: A test spell\n---\n\n# Body\n\nContent.\n`,
						},
					],
				},
			],
		});
		try {
			const result = repair(root, 'general/correct-name');
			assert.ok(result.fixes.some((f) => f.code === 'name-mismatch'));
			const content = readFileSync(join(root, 'general', 'correct-name', 'SKILL.md'), 'utf-8');
			const parsed = parseSkillMd(content);
			assert.ok(parsed.ok);
			if (parsed.ok) {
				assert.equal(parsed.frontmatter.name, 'correct-name');
			}
		} finally {
			cleanup();
		}
	});

	it('removes nested .git directory', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'git-infested' }] }],
		});
		try {
			mkdirSync(join(root, 'general', 'git-infested', '.git'), { recursive: true });
			const result = repair(root, 'general/git-infested');
			assert.ok(result.fixes.some((f) => f.code === 'nested-git'));
		} finally {
			cleanup();
		}
	});

	it('injects missing frontmatter', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [{ name: 'bare', content: '# Bare spell\n\nNo frontmatter here.\n' }],
				},
			],
		});
		try {
			const result = repair(root, 'general/bare');
			assert.ok(result.fixes.some((f) => f.code === 'missing-frontmatter'));
			const content = readFileSync(join(root, 'general', 'bare', 'SKILL.md'), 'utf-8');
			assert.ok(content.includes('---'));
		} finally {
			cleanup();
		}
	});

	it('returns empty fixes for healthy spell', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'healthy' }] }],
		});
		try {
			const result = repair(root, 'general/healthy');
			assert.equal(result.fixes.length, 0);
		} finally {
			cleanup();
		}
	});
});
