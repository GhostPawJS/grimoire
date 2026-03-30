import { execSync } from 'node:child_process';
import type { GrimoireDb } from '../database.ts';
import { logEvent } from '../events/log_event.ts';
import { execGit, resolveGitDir } from '../lib/exec_git.ts';
import { resolveNow } from '../resolve_now.ts';
import { allRanks } from './all_ranks.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext, SealResult } from './types.ts';

function statusPorcelain(ctx: GitContext): string {
	const dir = resolveGitDir(ctx.root, ctx.gitDir);
	return execSync(`git --work-tree="${ctx.root}" --git-dir="${dir}" status --porcelain -uall`, {
		encoding: 'utf-8',
		timeout: 10_000,
		stdio: 'pipe',
	}).trimEnd();
}

function extractSpellPaths(porcelain: string): string[] {
	const paths = new Set<string>();
	for (const line of porcelain.split('\n')) {
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
	if (!isGitAvailable()) {
		return { commitHash: '', sealedPaths: [], ranks: {} };
	}

	try {
		const status = statusPorcelain(ctx);
		if (status === '' && !paths) {
			return { commitHash: '', sealedPaths: [], ranks: {} };
		}

		let spellPaths: string[];
		if (paths && paths.length > 0) {
			spellPaths = paths;
			for (const p of paths) {
				execGit(ctx, `add "${p}/"`);
			}
		} else {
			spellPaths = extractSpellPaths(status);
			execGit(ctx, 'add -A');
		}

		const msg = message ?? 'seal';
		execGit(ctx, `commit --allow-empty -m "${msg}"`);
		const commitHash = execGit(ctx, 'rev-parse HEAD');

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
	} catch {
		return { commitHash: '', sealedPaths: [], ranks: {} };
	}
}
