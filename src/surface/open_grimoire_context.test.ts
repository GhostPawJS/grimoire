import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openGrimoireContext } from './open_grimoire_context.ts';

test('opens a database and initializes an explicit isolated spells directory', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'grimoire-context-'));
	try {
		const root = join(directory, 'spells');
		const context = await openGrimoireContext({ dbPath: ':memory:', root });
		try {
			assert.equal(context.root, root);
			assert.ok(existsSync(join(root, 'general')));
			assert.ok(
				context.db.prepare("SELECT name FROM sqlite_master WHERE name = 'spell_notes'").get(),
			);
		} finally {
			context.db.close();
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

test('explicit Git directories override the environment for CLI and MCP contexts', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'grimoire-context-env-'));
	const previous = process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
	try {
		const envDir = join(directory, 'environment-git');
		const flagDir = join(directory, 'flag-git');
		process.env.GHOSTPAW_GRIMOIRE_GIT_DIR = envDir;
		const inherited = await openGrimoireContext({ root: join(directory, 'a'), dbPath: ':memory:' });
		try {
			assert.equal(inherited.gitDir, envDir);
		} finally {
			inherited.db.close();
		}
		const explicit = await openGrimoireContext({
			root: join(directory, 'b'),
			dbPath: ':memory:',
			gitDir: flagDir,
		});
		try {
			assert.equal(explicit.gitDir, flagDir);
		} finally {
			explicit.db.close();
		}
	} finally {
		if (previous === undefined) delete process.env.GHOSTPAW_GRIMOIRE_GIT_DIR;
		else process.env.GHOSTPAW_GRIMOIRE_GIT_DIR = previous;
		rmSync(directory, { recursive: true, force: true });
	}
});
