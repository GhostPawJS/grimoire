import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { listChapters } from './list_chapters.ts';

describe('listChapters', () => {
	it('returns chapter names that contain spells', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [
				{ name: 'engineering', spells: [{ name: 'deploy' }] },
				{ name: 'general', spells: [{ name: 'writing' }] },
			],
		});
		try {
			const chapters = listChapters(root);
			assert.deepEqual(chapters, ['engineering', 'general']);
		} finally {
			cleanup();
		}
	});

	it('excludes dot-prefixed directories', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			mkdirSync(join(root, '.shelved', 'hidden'), { recursive: true });
			const chapters = listChapters(root);
			assert.deepEqual(chapters, ['general']);
		} finally {
			cleanup();
		}
	});

	it('returns empty array for empty root', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const chapters = listChapters(root);
			assert.deepEqual(chapters, []);
		} finally {
			cleanup();
		}
	});
});
