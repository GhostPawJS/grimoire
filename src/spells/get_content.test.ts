import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { getContent } from './get_content.ts';

describe('getContent', () => {
	it('returns raw SKILL.md content', () => {
		const custom = '---\nname: test\ndescription: Test\n---\n\n# Test\n\nBody here.\n';
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'test', content: custom }] }],
		});
		try {
			const content = getContent(root, 'general/test');
			assert.equal(content, custom);
		} finally {
			cleanup();
		}
	});

	it('logs read event when db is provided', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'test' }] }],
		});
		const db = createTestDb();
		try {
			getContent(root, 'general/test', db);
			const row = db
				.prepare('SELECT * FROM spell_events WHERE spell = ? AND event = ?')
				.get<{ spell: string; event: string }>('general/test', 'read');
			assert.ok(row);
			assert.equal(row.event, 'read');
		} finally {
			db.close();
			cleanup();
		}
	});
});
