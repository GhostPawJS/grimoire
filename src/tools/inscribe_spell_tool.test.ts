import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestRoot } from '../lib/test-root.ts';
import { inscribeSpellTool } from './inscribe_spell_tool.ts';

const validContent = [
	'---',
	'name: test-spell',
	'description: A test spell for validation',
	'---',
	'',
	'# Test Spell',
	'',
	'Body content here.',
	'',
].join('\n');

describe('inscribeSpellTool', () => {
	it('has correct metadata', () => {
		assert.equal(inscribeSpellTool.name, 'inscribe_spell');
		assert.equal(inscribeSpellTool.readOnly, false);
		assert.equal(inscribeSpellTool.sideEffects, 'writes_state');
		assert.deepEqual(inscribeSpellTool.targetKinds, ['spell']);
	});

	it('inscribes a spell and returns success', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await inscribeSpellTool.handler(
				{ root, db: undefined },
				{ name: 'test-spell', content: validContent },
			);
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.equal(result.outcome, 'success');
			assert.ok(result.summary.includes('test-spell'));
			assert.equal(result.data.spell.name, 'test-spell');
			assert.ok(result.entities.length > 0);
			assert.equal(result.entities[0]?.kind, 'spell');
		} finally {
			cleanup();
		}
	});

	it('places spell in specified chapter', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await inscribeSpellTool.handler(
				{ root, db: undefined },
				{ name: 'test-spell', content: validContent, chapter: 'advanced' },
			);
			assert.equal(result.ok, true);
			if (!result.ok) return;
			assert.equal(result.data.spell.chapter, 'advanced');
			assert.ok(result.data.spell.path.startsWith('advanced/'));
		} finally {
			cleanup();
		}
	});

	it('returns failure for invalid content', async () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = await inscribeSpellTool.handler(
				{ root, db: undefined },
				{ name: 'bad-spell', content: 'no frontmatter here' },
			);
			assert.equal(result.ok, false);
			if (result.ok) return;
			assert.equal(result.outcome, 'error');
		} finally {
			cleanup();
		}
	});
});
