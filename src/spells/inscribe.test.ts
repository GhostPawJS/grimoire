import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireValidationError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { inscribe } from './inscribe.ts';

const validContent = `---
name: my-spell
description: A brand new spell for testing inscription
---

# my-spell

This is the body of the spell.
`;

const similarContent = `---
name: similar-spell
description: A brand new spell for testing inscription
---

# similar-spell

Similar body.
`;

describe('inscribe', () => {
	it('creates spell directory and SKILL.md', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = inscribe(root, undefined, { name: 'my-spell', content: validContent });
			assert.equal(result.spell.name, 'my-spell');
			assert.equal(result.spell.chapter, 'general');
			assert.equal(result.spell.path, 'general/my-spell');
			assert.ok(existsSync(join(root, 'general', 'my-spell', 'SKILL.md')));
			const written = readFileSync(join(root, 'general', 'my-spell', 'SKILL.md'), 'utf-8');
			assert.equal(written, validContent);
		} finally {
			cleanup();
		}
	});

	it('uses provided chapter', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const result = inscribe(root, undefined, {
				name: 'my-spell',
				chapter: 'engineering',
				content: validContent,
			});
			assert.equal(result.spell.chapter, 'engineering');
			assert.ok(existsSync(join(root, 'engineering', 'my-spell', 'SKILL.md')));
		} finally {
			cleanup();
		}
	});

	it('returns warnings for similar spells', () => {
		const { root, cleanup } = createTestRoot();
		try {
			inscribe(root, undefined, { name: 'first-spell', content: validContent });
			const result = inscribe(root, undefined, {
				name: 'similar-spell',
				content: similarContent,
			});
			assert.ok(result.warnings.length > 0);
			assert.equal(result.warnings[0]?.existingPath, 'general/first-spell');
			assert.ok((result.warnings[0]?.similarity ?? 0) >= 0.3);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireValidationError on invalid content', () => {
		const { root, cleanup } = createTestRoot();
		try {
			assert.throws(
				() => inscribe(root, undefined, { name: 'bad', content: 'no frontmatter here' }),
				GrimoireValidationError,
			);
		} finally {
			cleanup();
		}
	});
});
