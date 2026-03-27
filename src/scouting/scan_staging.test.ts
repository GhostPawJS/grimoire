import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { scanStaging } from './scan_staging.ts';

const validSkill = `---
name: test-skill
description: A test skill for scanning
---

# test-skill

Body content here.
`;

const invalidSkill = 'no frontmatter here';

describe('scanStaging', () => {
	it('discovers valid skills', () => {
		const dir = mkdtempSync(join(tmpdir(), 'scan-staging-'));
		try {
			const skillDir = join(dir, 'test-skill');
			mkdirSync(skillDir);
			writeFileSync(join(skillDir, 'SKILL.md'), validSkill);

			const results = scanStaging(dir);
			assert.equal(results.length, 1);
			assert.equal(results[0]?.name, 'test-skill');
			assert.equal(results[0]?.valid, true);
			assert.equal(results[0]?.errors.length, 0);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('reports invalid skills', () => {
		const dir = mkdtempSync(join(tmpdir(), 'scan-staging-'));
		try {
			const skillDir = join(dir, 'bad-skill');
			mkdirSync(skillDir);
			writeFileSync(join(skillDir, 'SKILL.md'), invalidSkill);

			const results = scanStaging(dir);
			assert.equal(results.length, 1);
			assert.equal(results[0]?.valid, false);
			assert.ok((results[0]?.errors.length ?? 0) > 0);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('walks nested directories', () => {
		const dir = mkdtempSync(join(tmpdir(), 'scan-staging-'));
		try {
			const nested = join(dir, 'category', 'test-skill');
			mkdirSync(nested, { recursive: true });
			writeFileSync(join(nested, 'SKILL.md'), validSkill);

			const results = scanStaging(dir);
			assert.equal(results.length, 1);
			assert.equal(results[0]?.repoPath, join('category', 'test-skill'));
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it('returns empty for non-existent directory', () => {
		const results = scanStaging('/tmp/does-not-exist-scan-staging-grimoire');
		assert.equal(results.length, 0);
	});
});
