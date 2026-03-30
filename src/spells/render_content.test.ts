import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { renderContent } from './render_content.ts';

const baseContent = `---
name: test-spell
description: A test spell
---

# Test Spell

Body content here.
`;

const expertContent = `---
name: expert-spell
description: An expert spell
allowedTools: hammer, saw
---

# Expert Spell

Expert body content.
`;

const masterContent = `---
name: master-spell
description: A master spell
allowedTools: hammer, saw, wrench
---

# Master Spell

Intro content.

## Compiled

This is the compiled summary section.
With multiple lines.

## Other Section

More content.
`;

describe('renderContent', () => {
	it('returns basic rendered content', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'test', content: baseContent }] }],
		});
		try {
			const rendered = renderContent(root, 'general/test');
			assert.ok(rendered.body.includes('Body content here.'));
			assert.equal(rendered.tier, 'Uncheckpointed');
			assert.equal(rendered.rank, 0);
			assert.equal(rendered.allowedTools, undefined);
			assert.equal(rendered.compiledSummary, undefined);
		} finally {
			cleanup();
		}
	});

	it('does not include allowedTools at low rank', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'expert', content: expertContent }] }],
		});
		try {
			const rendered = renderContent(root, 'general/expert');
			assert.equal(rendered.allowedTools, undefined);
		} finally {
			cleanup();
		}
	});

	it('does not extract compiled summary at low rank', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'master', content: masterContent }] }],
		});
		try {
			const rendered = renderContent(root, 'general/master');
			assert.equal(rendered.compiledSummary, undefined);
		} finally {
			cleanup();
		}
	});

	it('logs read event when db is provided', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'test', content: baseContent }] }],
		});
		const db = createTestDb();
		try {
			renderContent(root, 'general/test', db);
			const row = db
				.prepare('SELECT * FROM spell_events WHERE spell = ? AND event = ?')
				.get<{ spell: string; event: string; context_id: string | null }>('general/test', 'read');
			assert.ok(row);
			assert.equal(row.event, 'read');
			assert.equal(row.context_id, null);
		} finally {
			db.close();
			cleanup();
		}
	});

	it('stores contextId in the read event when provided', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'test', content: baseContent }] }],
		});
		const db = createTestDb();
		try {
			renderContent(root, 'general/test', db, { contextId: 'session-abc' });
			const row = db
				.prepare('SELECT context_id FROM spell_events WHERE spell = ? AND event = ?')
				.get<{ context_id: string | null }>('general/test', 'read');
			assert.ok(row);
			assert.equal(row.context_id, 'session-abc');
		} finally {
			db.close();
			cleanup();
		}
	});

	it('stores numeric contextId as string in the read event', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'test', content: baseContent }] }],
		});
		const db = createTestDb();
		try {
			renderContent(root, 'general/test', db, { contextId: 99 });
			const row = db
				.prepare('SELECT context_id FROM spell_events WHERE spell = ? AND event = ?')
				.get<{ context_id: string | null }>('general/test', 'read');
			assert.ok(row);
			assert.equal(row.context_id, '99');
		} finally {
			db.close();
			cleanup();
		}
	});
});
