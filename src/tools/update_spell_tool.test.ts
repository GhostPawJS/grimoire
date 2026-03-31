import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { updateSpellTool } from './update_spell_tool.ts';

const VALID_CONTENT =
	'---\nname: writing\ndescription: How to write well\n---\n\n# writing\n\nUpdated body.\n';

describe('updateSpellTool', () => {
	it('has correct metadata', () => {
		assert.equal(updateSpellTool.name, 'update_spell');
		assert.equal(updateSpellTool.readOnly, false);
		assert.equal(updateSpellTool.sideEffects, 'writes_state');
		assert.deepEqual(updateSpellTool.targetKinds, ['spell']);
		assert.ok(updateSpellTool.description.length > 0);
		assert.ok(updateSpellTool.whenToUse.length > 0);
		assert.ok(updateSpellTool.whenNotToUse && updateSpellTool.whenNotToUse.length > 0);
	});

	it('has valid input schema with required path and content', () => {
		assert.equal(updateSpellTool.inputSchema.type, 'object');
		const props = updateSpellTool.inputSchema.properties ?? {};
		assert.ok('path' in props);
		assert.ok('content' in props);
		assert.ok(updateSpellTool.inputSchema.required?.includes('path'));
		assert.ok(updateSpellTool.inputSchema.required?.includes('content'));
	});

	it('writes content to disk and returns success', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			const result = updateSpellTool.handler(
				{ root },
				{ path: 'general/writing', content: VALID_CONTENT },
			);
			assert.ok(!(result instanceof Promise));
			assert.equal(result.ok, true);
			assert.equal(result.outcome, 'success');
			assert.ok(result.summary.includes('general/writing'));
			const written = readFileSync(join(root, 'general/writing/SKILL.md'), 'utf-8');
			assert.equal(written, VALID_CONTENT);
		} finally {
			cleanup();
		}
	});

	it('returns error for invalid SKILL.md content', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			const result = updateSpellTool.handler(
				{ root },
				{ path: 'general/writing', content: 'not valid frontmatter' },
			);
			assert.ok(!(result instanceof Promise));
			assert.equal(result.ok, false);
			assert.equal(result.outcome, 'error');
		} finally {
			cleanup();
		}
	});

	it('returns error for a spell that does not exist', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = updateSpellTool.handler(
				{ root },
				{ path: 'general/nonexistent', content: VALID_CONTENT },
			);
			assert.ok(!(result instanceof Promise));
			assert.equal(result.ok, false);
			assert.equal(result.outcome, 'error');
		} finally {
			cleanup();
		}
	});

	it('suggests hone_spell as next step', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			const result = updateSpellTool.handler(
				{ root },
				{ path: 'general/writing', content: VALID_CONTENT },
			);
			assert.ok(!(result instanceof Promise));
			assert.ok(result.ok);
			const honeNext = result.next?.find((h) => h.tool === 'hone_spell');
			assert.ok(honeNext, 'should suggest hone_spell');
		} finally {
			cleanup();
		}
	});
});
