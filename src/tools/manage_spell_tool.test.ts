import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { inscribe } from '../spells/inscribe.ts';
import { manageSpellTool } from './manage_spell_tool.ts';

const validContent = [
	'---',
	'name: test-spell',
	'description: A test spell for manage tool',
	'---',
	'',
	'# Test Spell',
	'',
	'Body content here.',
	'',
].join('\n');

function inscribeTestSpell(root: string, name = 'test-spell', chapter = 'general'): string {
	const content = validContent.replace(/test-spell/g, name);
	const result = inscribe(root, undefined, { name, content, chapter });
	return result.spell.path;
}

describe('manageSpellTool', () => {
	it('has correct metadata', () => {
		assert.equal(manageSpellTool.name, 'manage_spell');
		assert.equal(manageSpellTool.readOnly, false);
		assert.equal(manageSpellTool.sideEffects, 'writes_state');
		assert.deepEqual(manageSpellTool.targetKinds, ['spell']);
		assert.deepEqual(manageSpellTool.inputSchema.properties?.action?.enum, [
			'shelve',
			'unshelve',
			'move',
			'delete',
			'repair',
			'repair_all',
			'rollback',
		]);
	});

	it('deletes a spell', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const path = inscribeTestSpell(root);
			assert.ok(existsSync(join(root, path)));

			const result = await manageSpellTool.handler(
				{ root, db: undefined },
				{ action: 'delete', path },
			);
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.equal(result.outcome, 'success');
			assert.ok(result.summary.includes(path));
			assert.ok(!existsSync(join(root, path)));
		} finally {
			cleanup();
		}
	});

	it('shelves a spell', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const path = inscribeTestSpell(root);
			const result = await manageSpellTool.handler(
				{ root, db: undefined },
				{ action: 'shelve', path },
			);
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.equal(result.outcome, 'success');
			assert.ok(!existsSync(join(root, path)));
			assert.ok(existsSync(join(root, '.shelved', path)));
		} finally {
			cleanup();
		}
	});

	it('repairs a healthy spell with zero fixes', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const path = inscribeTestSpell(root);
			const result = await manageSpellTool.handler(
				{ root, db: undefined },
				{ action: 'repair', path },
			);
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.ok(result.summary.includes('no repairs'));
		} finally {
			cleanup();
		}
	});

	it('repair_all on empty root returns healthy', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await manageSpellTool.handler(
				{ root, db: undefined },
				{ action: 'repair_all' },
			);
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.ok(result.summary.includes('healthy'));
		} finally {
			cleanup();
		}
	});

	it('rollback fails gracefully without git', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await manageSpellTool.handler(
				{ root, db: undefined },
				{ action: 'rollback', path: 'general/test-spell', ref: 'abcd1234' },
			);
			assert.equal(result.ok, false);
		} finally {
			cleanup();
		}
	});

	it('returns error for non-existent spell on delete', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await manageSpellTool.handler(
				{ root, db: undefined },
				{ action: 'delete', path: 'general/no-such-spell' },
			);
			assert.equal(result.ok, false);
			if (result.ok) return;
			assert.equal(result.outcome, 'error');
		} finally {
			cleanup();
		}
	});
});
