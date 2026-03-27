import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { logEvent } from '../events/log_event.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { execGit } from '../lib/exec_git.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function moveSpell(
	root: string,
	from: string,
	to: string,
	db?: GrimoireDb,
): { from: string; to: string } {
	assertSpellExists(root, from);

	const source = join(root, from);
	const dest = join(root, to);
	mkdirSync(dirname(dest), { recursive: true });
	cpSync(source, dest, { recursive: true });
	rmSync(source, { recursive: true, force: true });

	if (isGitAvailable()) {
		try {
			execGit({ root }, 'add -A');
			execGit({ root }, `commit -m "move ${from} -> ${to}"`);
		} catch {
			// Git commit may fail; safe to ignore.
		}
	}

	if (db) {
		try {
			updateProvenance(db, {
				spellPath: to,
				sourceType: 'local',
			});
		} catch {
			// Provenance may not exist for this spell.
		}
		logEvent(db, { spell: to, event: 'move' });
	}

	return { from, to };
}
