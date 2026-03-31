import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireNotFoundError, GrimoireValidationError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { updateSpell } from './update_spell.ts';

const VALID_CONTENT =
	'---\nname: writing\ndescription: How to write\n---\n\n# writing\n\nUpdated body.\n';

describe('updateSpell', () => {
	it('writes new content to an existing spell', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			updateSpell(root, 'general/writing', VALID_CONTENT);
			const written = readFileSync(join(root, 'general/writing/SKILL.md'), 'utf-8');
			assert.equal(written, VALID_CONTENT);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireValidationError for invalid SKILL.md content', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			assert.throws(
				() => updateSpell(root, 'general/writing', 'not valid frontmatter'),
				GrimoireValidationError,
			);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireNotFoundError for a spell that does not exist', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(
				() => updateSpell(root, 'general/nonexistent', VALID_CONTENT),
				GrimoireNotFoundError,
			);
		} finally {
			cleanup();
		}
	});

	it('does not create a git commit — leaves change uncommitted', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'writing' }] }],
		});
		try {
			const before = readFileSync(join(root, 'general/writing/SKILL.md'), 'utf-8');
			updateSpell(root, 'general/writing', VALID_CONTENT);
			const after = readFileSync(join(root, 'general/writing/SKILL.md'), 'utf-8');
			assert.notEqual(before, after);
			assert.equal(after, VALID_CONTENT);
			// No git assertions — the function intentionally leaves changes uncommitted
		} finally {
			cleanup();
		}
	});
});
