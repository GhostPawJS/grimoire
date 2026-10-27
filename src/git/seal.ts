import { existsSync } from 'node:fs';
import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError, GrimoireStateError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit, resolveGitDir } from '../lib/exec_git.ts';
import { resolveInsideRoot, resolveSpellPath } from '../lib/safe_path.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { resolveNow } from '../resolve_now.ts';
import { allRanks } from './all_ranks.ts';
import { commitIdentity } from './commit_identity.ts';
import { hasGitRepository } from './has_git_repository.ts';
import type { GitContext, SealResult } from './types.ts';

function statusPorcelain(ctx: GitContext): string {
	return execGit(
		ctx,
		['status', '--porcelain', '-uall', '-z', '--', '.', ':!.grimoire-git', ':!.shelved'],
		{ trim: false },
	);
}

function extractSpellPaths(porcelain: string): string[] {
	const paths = new Set<string>();
	for (const line of porcelain.split('\0')) {
		if (line === '') continue;
		const file = line.slice(3);
		const parts = file.split('/');
		if (parts.length >= 2) {
			paths.add(`${parts[0]}/${parts[1]}`);
		}
	}
	return [...paths];
}

export function seal(
	ctx: GitContext,
	db?: GrimoireDb,
	paths?: string[],
	message?: string,
): SealResult {
	for (const path of paths ?? []) {
		if (!existsSync(resolveInsideRoot(resolveSpellPath(ctx.root, path), 'SKILL.md')))
			throw new GrimoireNotFoundError(`Spell not found: ${path}`);
	}
	if (!hasGitRepository(ctx)) {
		return { commitHash: '', sealedPaths: [], ranks: {} };
	}

	try {
		return withGitLock(resolveGitDir(ctx.root, ctx.gitDir), () => {
			for (const path of paths ?? []) {
				if (!existsSync(resolveInsideRoot(resolveSpellPath(ctx.root, path), 'SKILL.md')))
					throw new GrimoireNotFoundError(`Spell not found: ${path}`);
			}
			const status = statusPorcelain(ctx);
			let spellPaths = paths?.length
				? paths
				: extractSpellPaths(status).filter((p) => {
						try {
							resolveSpellPath(ctx.root, p);
							return !p.startsWith('.');
						} catch {
							return false;
						}
					});
			assertGitScope(ctx, []);
			if (!spellPaths.length) return { commitHash: '', sealedPaths: [], ranks: {} };
			const scoped = spellPaths.map((p) => `${p}/`);
			execGit(ctx, ['add', '-A', '--', ...scoped]);
			const changed = execGit(ctx, [
				'diff',
				'--cached',
				'--name-only',
				'-z',
				'--',
				...scoped,
			]).split('\0');
			spellPaths = spellPaths.filter((path) => changed.some((file) => file.startsWith(`${path}/`)));
			if (!spellPaths.length) return { commitHash: '', sealedPaths: [], ranks: {} };
			execGit(ctx, [...commitIdentity(ctx), 'commit', '-m', message ?? 'seal', '--', ...scoped]);
			const commitHash = execGit(ctx, ['rev-parse', 'HEAD']);

			const ranks = allRanks(ctx);
			const sealedRanks: Record<string, number> = {};
			for (const p of spellPaths) {
				sealedRanks[p] = ranks[p] ?? 0;
			}

			if (db) {
				const now = resolveNow();
				for (const p of spellPaths) {
					logEvent(db, { spell: p, event: 'seal', now });
				}
			}

			return { commitHash, sealedPaths: spellPaths, ranks: sealedRanks };
		});
	} catch (error) {
		if (error instanceof GrimoireNotFoundError || error instanceof GrimoireStateError) throw error;
		throw new GrimoireStateError(
			`Could not seal spell changes: ${error instanceof Error ? error.message : String(error)}. Inspect pending changes and resolve the Git error before retrying.`,
		);
	}
}
