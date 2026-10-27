import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { GrimoireValidationError } from '../errors.ts';
import { adoptSpell } from './adopt_spell.ts';
import { cloneRepo } from './clone_repo.ts';
import { scanStaging } from './scan_staging.ts';

const content = '---\nname: sample\ndescription: Sample procedure\n---\n\nBody\n';
test('staging reports invalid directory names and skips linked skills and files', () => {
	const base = mkdtempSync(join(tmpdir(), 'grimoire-staging-'));
	try {
		const staged = join(base, 'staged');
		mkdirSync(staged);
		for (const name of ['sample', 'Bad_name']) {
			mkdirSync(join(staged, name));
			writeFileSync(join(staged, name, 'SKILL.md'), content);
		}
		writeFileSync(join(base, 'reference'), 'outside');
		symlinkSync(join(base, 'reference'), join(staged, 'sample', 'reference'));
		symlinkSync(join(staged, 'sample'), join(staged, 'linked'), 'dir');
		mkdirSync(join(staged, 'linked-file'));
		symlinkSync(join(staged, 'sample', 'SKILL.md'), join(staged, 'linked-file', 'SKILL.md'));
		const results = scanStaging(staged);
		assert.equal(results.length, 2);
		const invalid = results.find((skill) => skill.repoPath === 'Bad_name');
		assert.equal(invalid?.valid, false);
		assert.match(invalid?.errors.join(' ') ?? '', /name must match/);
		const root = join(base, 'root');
		mkdirSync(root);
		adoptSpell(root, undefined, join(staged, 'sample'));
		assert.equal(existsSync(join(root, 'general/sample/SKILL.md')), true);
		assert.equal(existsSync(join(root, 'general/sample/reference')), false);
		assert.throws(
			() => adoptSpell(root, undefined, join(staged, 'sample'), { chapter: '../escaped' }),
			GrimoireValidationError,
		);
		assert.equal(existsSync(join(base, 'escaped')), false);
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
});
test('clone validates URLs and refs before invoking Git', async () => {
	const base = mkdtempSync(join(tmpdir(), 'grimoire-clone-'));
	try {
		for (const url of [
			'--upload-pack=touch marker',
			'ssh://host/repo',
			'git@host:repo',
			'relative/repo',
			'https://host/repo\0',
		])
			await assert.rejects(cloneRepo(url, join(base, 'dest')), GrimoireValidationError);
		for (const ref of ['--upload-pack=x', 'two words', 'a\n', 'a\0', 'a\x7f', 'a\u0085'])
			await assert.rejects(
				cloneRepo('file:///unused', join(base, 'dest'), ref),
				GrimoireValidationError,
			);
		assert.equal(existsSync(join(base, 'dest')), false);
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
});
