import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireConflictError, GrimoireNotFoundError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { commitIdentity } from '../git/commit_identity.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveInsideRoot, resolveSpellPath } from '../lib/safe_path.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';

export function unshelve(
	root: string,
	shelvedPath: string,
	db?: GrimoireDb,
	options?: { force?: boolean },
): { path: string } {
	resolveSpellPath(root, shelvedPath, true);
	const source = resolveInsideRoot(root, '.shelved', shelvedPath);
	if (!existsSync(source)) {
		throw new GrimoireNotFoundError(`Shelved spell not found: .shelved/${shelvedPath}`);
	}

	const dest = resolveSpellPath(root, shelvedPath, true);
	if (existsSync(dest)) {
		if (!options?.force) throw new GrimoireConflictError(shelvedPath);
		rmSync(dest, { recursive: true, force: true });
	}
	mkdirSync(dirname(dest), { recursive: true });
	cpSync(source, dest, { recursive: true });
	rmSync(source, { recursive: true, force: true });

	if (isGitAvailable()) {
		try {
			execGit({ root }, ['add', '-A']);
			execGit({ root }, [...commitIdentity({ root }), 'commit', '-m', `unshelve ${shelvedPath}`]);
		} catch {
			// Git commit may fail; safe to ignore.
		}
	}

	if (db) {
		try {
			updateProvenance(db, {
				spellPath: shelvedPath,
				sourceType: 'local',
			});
		} catch {
			// Provenance record may not exist.
		}
		logEvent(db, { spell: shelvedPath, event: 'unshelve' });
	}

	return { path: shelvedPath };
}
