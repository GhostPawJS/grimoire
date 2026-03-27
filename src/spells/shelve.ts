import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { logEvent } from '../events/log_event.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { execGit } from '../lib/exec_git.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function shelve(root: string, path: string, db?: GrimoireDb): { path: string } {
	assertSpellExists(root, path);

	const source = join(root, path);
	const shelvedPath = join(root, '.shelved', path);

	mkdirSync(dirname(shelvedPath), { recursive: true });
	cpSync(source, shelvedPath, { recursive: true });
	rmSync(source, { recursive: true, force: true });

	if (isGitAvailable()) {
		try {
			execGit({ root }, 'add -A');
			execGit({ root }, `commit -m "shelve ${path}"`);
		} catch {
			// Git commit may fail if no changes staged; safe to ignore.
		}
	}

	if (db) {
		logEvent(db, { spell: path, event: 'shelve' });
	}

	return { path: `.shelved/${path}` };
}
