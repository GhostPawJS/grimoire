import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { validate } from './validate.ts';

describe('validate', () => {
	let root: string;
	let cleanup: () => void;

	beforeEach(() => {
		const result = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [{ name: 'my-spell' }],
				},
			],
		});
		root = result.root;
		cleanup = result.cleanup;
	});

	afterEach(() => {
		cleanup();
	});

	it('validates a valid spell', () => {
		const result = validate(root, 'general/my-spell');
		assert.equal(result.valid, true);
		assert.equal(result.path, 'general/my-spell');
	});

	it('reports missing SKILL.md', () => {
		const result = validate(root, 'general/nonexistent');
		assert.equal(result.valid, false);
		assert.ok(result.issues.some((i) => i.code === 'missing-skill-md'));
	});

	it('reports name mismatch', () => {
		const testRoot = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [
						{
							name: 'dir-name',
							content: '---\nname: other-name\ndescription: A spell\n---\n\nBody.',
						},
					],
				},
			],
		});
		const result = validate(testRoot.root, 'general/dir-name');
		assert.ok(result.issues.some((i) => i.code === 'name-mismatch'));
		testRoot.cleanup();
	});

	it('reports oversize spell', () => {
		const longBody = Array.from({ length: 501 }, (_, i) => `Line ${i + 1}`).join('\n');
		const testRoot = createTestRoot({
			chapters: [
				{
					name: 'general',
					spells: [
						{
							name: 'big-spell',
							content: `---\nname: big-spell\ndescription: Big\n---\n\n${longBody}`,
						},
					],
				},
			],
		});
		const result = validate(testRoot.root, 'general/big-spell');
		assert.ok(result.issues.some((i) => i.code === 'oversize'));
		testRoot.cleanup();
	});
});
