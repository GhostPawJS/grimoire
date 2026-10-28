import { hasGitRepository } from '../git/has_git_repository.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { discoverSpells } from './discover_spells.ts';
import { repair } from './repair.ts';
import type { RepairResult } from './types.ts';

export function repairAll(root: string, options?: { gitDir?: string }): RepairResult[] {
	const spells = discoverSpells(root);
	const ctx = { root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) };
	const paths = new Set(spells.map((spell) => spell.path));
	if (hasGitRepository(ctx)) {
		assertGitScope(ctx, []);
		for (const file of execGit(ctx, ['ls-files', '-z']).split('\0').filter(Boolean)) {
			if (!file.startsWith('.')) paths.add(file.split('/').slice(0, 2).join('/'));
		}
	}
	validateStagingPaths(root, [...paths]);
	return [...paths].map((path) => repair(root, path, options));
}
