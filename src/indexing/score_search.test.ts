import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { buildIndex } from './build_index.ts';
import { scoreSearch } from './score_search.ts';

test('multi-term, inflected, body, fuzzy, and legacy substring searches are ranked deterministically', () => {
	const content = (name: string, description: string, body: string) =>
		`---\nname: ${name}\ndescription: ${description}\n---\n${body}\n`;
	const { root, cleanup } = createTestRoot({
		chapters: [
			{
				name: 'ops',
				spells: [
					{
						name: 'upload',
						content: content(
							'upload',
							'Post image to a VPS',
							'Post the image to your VPS after checking SHA256.',
						),
					},
					{
						name: 'routines',
						content: content(
							'routines',
							'Manage recurring tasks and reminders',
							'Track reminders.',
						),
					},
					{ name: 'other', content: content('other', 'General operations', 'Post an update.') },
				],
			},
		],
	});
	try {
		const entries = buildIndex(root);
		const search = (query: string) => scoreSearch(root, entries, query);
		assert.equal(search('post image VPS')[0]?.name, 'upload');
		assert.equal(search('set up a recurring reminder')[0]?.name, 'routines');
		assert.equal(search('sha256')[0]?.name, 'upload');
		assert.equal(search('rountines')[0]?.name, 'routines');
		assert.ok(search('pload').some((entry) => entry.name === 'upload'));
		assert.deepEqual(search('post'), search('post'));
		assert.ok(search('post').every((entry) => entry.score > 0));
		assert.deepEqual(search('unrelatedzzzz'), []);
	} finally {
		cleanup();
	}
});
