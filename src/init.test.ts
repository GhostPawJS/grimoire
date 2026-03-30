import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { DEFAULTS } from './defaults.ts';
import { isGitAvailable } from './git/is_git_available.ts';
import { init } from './init.ts';
import { resolveGitDir } from './lib/exec_git.ts';
import { openTestDatabase } from './lib/open-test-database.ts';
import { createTestRoot } from './lib/test-root.ts';

describe('init', () => {
	let cleanup: (() => void) | undefined;

	afterEach(() => {
		cleanup?.();
		cleanup = undefined;
	});

	it('creates root and default chapter directory', () => {
		const { root, cleanup: c } = createTestRoot();
		cleanup = c;

		const subRoot = join(root, 'grimoire');
		init(subRoot);

		assert.ok(existsSync(subRoot), 'root should exist');
		assert.ok(
			existsSync(join(subRoot, DEFAULTS.defaultChapter)),
			'default chapter directory should exist',
		);
	});

	it('initializes tables when db is provided', () => {
		const { root, cleanup: c } = createTestRoot();
		cleanup = c;

		const db = openTestDatabase();
		const subRoot = join(root, 'grimoire');
		init(subRoot, db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC")
			.all<{ name: string }>();
		const tableNames = tables.map((t) => t.name);

		assert.ok(tableNames.includes('spell_events'), 'should create spell_events table');
		assert.ok(tableNames.includes('spell_notes'), 'should create spell_notes table');
		db.close();
	});

	it('does not throw when db is omitted', () => {
		const { root, cleanup: c } = createTestRoot();
		cleanup = c;

		const subRoot = join(root, 'grimoire');
		assert.doesNotThrow(() => init(subRoot));
	});

	it('is idempotent', () => {
		const { root, cleanup: c } = createTestRoot();
		cleanup = c;

		const subRoot = join(root, 'grimoire');
		init(subRoot);
		assert.doesNotThrow(() => init(subRoot));
	});

	it('seeds an initial commit so git log exits cleanly on a fresh repo', () => {
		if (!isGitAvailable()) return;

		const { root, cleanup: c } = createTestRoot();
		cleanup = c;

		const subRoot = join(root, 'grimoire');
		const gitDir = resolveGitDir(subRoot);
		init(subRoot);

		assert.doesNotThrow(() => {
			execSync(`git --work-tree="${subRoot}" --git-dir="${gitDir}" log --oneline`, {
				encoding: 'utf-8',
				stdio: 'pipe',
			});
		}, 'git log should exit 0 — repo must not be in "no commits yet" state');
	});
});
