import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GrimoireValidationError } from '../errors.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { adoptSpell } from './adopt_spell.ts';

const validContent = `---
name: adopted-skill
description: A skill ready for adoption testing
---

# adopted-skill

This skill was adopted from an external source.
`;

const similarContent = `---
name: similar-adopted
description: A skill ready for adoption testing
---

# similar-adopted

Similar body content.
`;

describe('adoptSpell', () => {
	it('adopts a spell from a local path', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const staging = join(root, '.staging', 'adopted-skill');
			mkdirSync(staging, { recursive: true });
			writeFileSync(join(staging, 'SKILL.md'), validContent);

			const result = adoptSpell(root, undefined, staging);
			assert.equal(result.spell.name, 'adopted-skill');
			assert.equal(result.spell.chapter, 'general');
			assert.equal(result.spell.path, 'general/adopted-skill');
			assert.ok(existsSync(join(root, 'general', 'adopted-skill', 'SKILL.md')));
		} finally {
			cleanup();
		}
	});

	it('creates the target directory structure', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const staging = join(root, '.staging', 'adopted-skill');
			mkdirSync(staging, { recursive: true });
			writeFileSync(join(staging, 'SKILL.md'), validContent);

			adoptSpell(root, undefined, staging, { chapter: 'engineering' });
			assert.ok(existsSync(join(root, 'engineering', 'adopted-skill', 'SKILL.md')));
		} finally {
			cleanup();
		}
	});

	it('injects provenance metadata into SKILL.md', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const staging = join(root, '.staging', 'adopted-skill');
			mkdirSync(staging, { recursive: true });
			writeFileSync(join(staging, 'SKILL.md'), validContent);

			const now = Date.now();
			adoptSpell(root, undefined, staging, {
				provenance: {
					spellPath: 'general/adopted-skill',
					sourceType: 'github',
					sourceUrl: 'https://github.com/acme/skills',
					sourceVersion: '1.0.0',
				},
				now,
			});

			const written = readFileSync(join(root, 'general', 'adopted-skill', 'SKILL.md'), 'utf-8');
			assert.ok(written.includes('source: https://github.com/acme/skills'));
			assert.ok(written.includes('sourceVersion: 1.0.0'));
			assert.ok(written.includes('importedAt:'));
		} finally {
			cleanup();
		}
	});

	it('returns duplication warnings for similar spells', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const staging1 = join(root, '.staging', 'adopted-skill');
			mkdirSync(staging1, { recursive: true });
			writeFileSync(join(staging1, 'SKILL.md'), validContent);
			adoptSpell(root, undefined, staging1);

			const staging2 = join(root, '.staging', 'similar-adopted');
			mkdirSync(staging2, { recursive: true });
			writeFileSync(join(staging2, 'SKILL.md'), similarContent);

			const result = adoptSpell(root, undefined, staging2);
			assert.ok(result.warnings.length > 0);
			assert.equal(result.warnings[0]?.existingPath, 'general/adopted-skill');
		} finally {
			cleanup();
		}
	});

	it('throws if spell already exists at target', () => {
		const { root, cleanup } = createTestRoot({
			chapters: [{ name: 'general', spells: [{ name: 'adopted-skill' }] }],
		});
		try {
			const staging = join(root, '.staging', 'adopted-skill');
			mkdirSync(staging, { recursive: true });
			writeFileSync(join(staging, 'SKILL.md'), validContent);

			assert.throws(() => adoptSpell(root, undefined, staging), GrimoireValidationError);
		} finally {
			cleanup();
		}
	});

	it('throws GrimoireValidationError for invalid SKILL.md', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const staging = join(root, '.staging', 'bad');
			mkdirSync(staging, { recursive: true });
			writeFileSync(join(staging, 'SKILL.md'), 'no frontmatter');

			assert.throws(() => adoptSpell(root, undefined, staging), GrimoireValidationError);
		} finally {
			cleanup();
		}
	});

	it('throws if no SKILL.md in local path', () => {
		const { root, cleanup } = createTestRoot();
		try {
			const staging = join(root, '.staging', 'empty');
			mkdirSync(staging, { recursive: true });

			assert.throws(() => adoptSpell(root, undefined, staging), GrimoireValidationError);
		} finally {
			cleanup();
		}
	});
});
