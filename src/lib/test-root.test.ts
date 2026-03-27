import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from './test-root.ts';

describe('createTestRoot', () => {
	it('creates an empty root directory', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.ok(existsSync(root));
		} finally {
			cleanup();
		}
		assert.ok(!existsSync(root));
	});

	it('creates chapters and spells from layout', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{
					name: 'engineering',
					spells: [{ name: 'deploy-vercel' }, { name: 'testing-patterns' }],
				},
				{
					name: 'general',
					spells: [{ name: 'effective-writing' }],
				},
			],
		});
		try {
			assert.ok(existsSync(join(root, 'engineering', 'deploy-vercel', 'SKILL.md')));
			assert.ok(existsSync(join(root, 'engineering', 'testing-patterns', 'SKILL.md')));
			assert.ok(existsSync(join(root, 'general', 'effective-writing', 'SKILL.md')));

			const content = readFileSync(join(root, 'engineering', 'deploy-vercel', 'SKILL.md'), 'utf-8');
			assert.ok(content.includes('name: deploy-vercel'));
		} finally {
			cleanup();
		}
	});

	it('supports custom content for spells', () => {
		const custom = '---\nname: custom\ndescription: Custom\n---\n\n# Custom\n\nCustom body.\n';
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'custom', content: custom }] }],
		});
		try {
			const content = readFileSync(join(root, 'general', 'custom', 'SKILL.md'), 'utf-8');
			assert.equal(content, custom);
		} finally {
			cleanup();
		}
	});
});
