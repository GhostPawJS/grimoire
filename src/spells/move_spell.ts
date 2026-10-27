import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireConflictError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { commitIdentity } from '../git/commit_identity.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

export function moveSpell(
	root: string,
	from: string,
	to: string,
	db?: GrimoireDb,
	options?: { force?: boolean },
): { from: string; to: string } {
	assertSpellExists(root, from);

	const source = resolveSpellPath(root, from);
	const dest = resolveSpellPath(root, to, true);
	if (existsSync(dest)) {
		if (!options?.force || dest === resolveSpellPath(root, from))
			throw new GrimoireConflictError(to);
		rmSync(dest, { recursive: true, force: true });
	}
	mkdirSync(dirname(dest), { recursive: true });
	cpSync(source, dest, { recursive: true });
	rmSync(source, { recursive: true, force: true });

	if (isGitAvailable()) {
		try {
			execGit({ root }, ['add', '-A']);
			execGit({ root }, [...commitIdentity({ root }), 'commit', '-m', `move ${from} -> ${to}`]);
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
