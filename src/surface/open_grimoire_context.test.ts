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
