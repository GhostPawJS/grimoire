import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createTestDb } from '../lib/test-db.ts';
import { createTestRoot } from '../lib/test-root.ts';
import { scout } from './scout.ts';

const validSkill = `---
name: scouted-skill
description: A scouted skill for testing
---

# scouted-skill

Body content.
`;

describe('scout', () => {
	it('scouts and adopts from a local path', async () => {
		const { root, cleanup: cleanupRoot } = createTestRoot();
		const staging = mkdtempSync(join(tmpdir(), 'grimoire-scout-test-'));
		const db = createTestDb();
		try {
			const skillDir = join(staging, 'scouted-skill');
			mkdirSync(skillDir);
			writeFileSync(join(skillDir, 'SKILL.md'), validSkill);

			const result = await scout(root, db, staging);
			assert.equal(result.imported.length, 1);
			assert.equal(result.imported[0]?.spell.name, 'scouted-skill');
			assert.ok(existsSync(join(root, 'general', 'scouted-skill', 'SKILL.md')));
		} finally {
			db.close();
			cleanupRoot();
			rmSync(staging, { recursive: true, force: true });
		}
	});

	it('filters skills using options.filter', async () => {
		const { root, cleanup: cleanupRoot } = createTestRoot();
		const staging = mkdtempSync(join(tmpdir(), 'grimoire-scout-test-'));
		const db = createTestDb();
		try {
			for (const name of ['skill-keep', 'skill-skip']) {
				const skillDir = join(staging, name);
				mkdirSync(skillDir);
				writeFileSync(
					join(skillDir, 'SKILL.md'),
					`---\nname: ${name}\ndescription: Skill ${name}\n---\n\n# ${name}\n\nBody.\n`,
				);
			}

			const result = await scout(root, db, staging, {
				filter: (s) => s.name === 'skill-keep',
			});
			assert.equal(result.imported.length, 1);
			assert.equal(result.imported[0]?.spell.name, 'skill-keep');
		} finally {
			db.close();
			cleanupRoot();
			rmSync(staging, { recursive: true, force: true });
		}
	});

	it('returns empty result for empty source', async () => {
		const { root, cleanup: cleanupRoot } = createTestRoot();
		const staging = mkdtempSync(join(tmpdir(), 'grimoire-scout-test-'));
		const db = createTestDb();
		try {
			const result = await scout(root, db, staging);
			assert.equal(result.imported.length, 0);
			assert.equal(result.errors.length, 0);
		} finally {
			db.close();
			cleanupRoot();
			rmSync(staging, { recursive: true, force: true });
		}
	});

	it('uses custom chapter option', async () => {
		const { root, cleanup: cleanupRoot } = createTestRoot();
		const staging = mkdtempSync(join(tmpdir(), 'grimoire-scout-test-'));
		const db = createTestDb();
		try {
			const skillDir = join(staging, 'scouted-skill');
			mkdirSync(skillDir);
			writeFileSync(join(skillDir, 'SKILL.md'), validSkill);

			const result = await scout(root, db, staging, { chapter: 'engineering' });
			assert.equal(result.imported.length, 1);
			assert.equal(result.imported[0]?.spell.chapter, 'engineering');
			assert.ok(existsSync(join(root, 'engineering', 'scouted-skill', 'SKILL.md')));
		} finally {
			db.close();
			cleanupRoot();
			rmSync(staging, { recursive: true, force: true });
		}
	});
});
