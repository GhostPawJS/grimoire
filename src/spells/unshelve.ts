import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { execGit } from '../lib/exec_git.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';

export function unshelve(root: string, shelvedPath: string, db?: GrimoireDb): { path: string } {
	const source = join(root, '.shelved', shelvedPath);
	if (!existsSync(source)) {
		throw new GrimoireNotFoundError(`Shelved spell not found: .shelved/${shelvedPath}`);
	}

	const dest = join(root, shelvedPath);
	mkdirSync(dirname(dest), { recursive: true });
	cpSync(source, dest, { recursive: true });
	rmSync(source, { recursive: true, force: true });

	if (isGitAvailable()) {
		try {
			execGit({ root }, 'add -A');
			execGit({ root }, `commit -m "unshelve ${shelvedPath}"`);
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
