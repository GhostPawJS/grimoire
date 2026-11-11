import type { GrimoireDb } from '../database.ts';
import { GrimoireStateError } from '../errors.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { errorMessage } from '../lib/error_message.ts';
import { adoptSpell } from './adopt_spell.ts';
import type { AdoptResult, AdoptSpellOptions } from './types.ts';

export function adoptSpells(
	root: string,
	db: GrimoireDb | undefined,
	localPaths: string[],
	options?: AdoptSpellOptions,
): AdoptResult {
	const result: AdoptResult = { adopted: [], skipped: [], errors: [] };

	try {
		const ctx = { root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) };
		if (hasGitRepository(ctx)) assertGitScope(ctx, []);
	} catch (error) {
		result.errors.push({
			path: root,
			error: errorMessage(error),
			code: 'seal_failed',
		});
		return result;
	}

	for (const localPath of localPaths) {
		try {
			const adopted = adoptSpell(root, db, localPath, options);
			result.adopted.push(adopted);
		} catch (err) {
			const message = errorMessage(err);
			result.errors.push({
				path: localPath,
				error: message,
				...(err instanceof GrimoireStateError ? { code: 'seal_failed' } : {}),
			});
		}
	}

	return result;
}
