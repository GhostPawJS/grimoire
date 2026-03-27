import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { repairAll } from './repair_all.ts';

describe('repairAll', () => {
	it('repairs multiple spells', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [
						{
							name: 'fix-me',
							content: `---\nname: wrong\ndescription: Needs name fix\n---\n\n# Body\n\nContent.\n`,
						},
						{ name: 'fine' },
					],
				},
			],
		});
		try {
			mkdirSync(join(root, 'general', 'fine', '.git'), { recursive: true });
			const results = repairAll(root);
			assert.equal(results.length, 2);
			const fixMe = results.find((r) => r.path === 'general/fix-me');
			const fine = results.find((r) => r.path === 'general/fine');
			assert.ok(fixMe);
			assert.ok(fixMe.fixes.length > 0);
			assert.ok(fine);
			assert.ok(fine.fixes.some((f) => f.code === 'nested-git'));
		} finally {
			cleanup();
		}
	});

	it('returns empty array for empty root', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const results = repairAll(root);
			assert.deepEqual(results, []);
		} finally {
			cleanup();
		}
	});
});
