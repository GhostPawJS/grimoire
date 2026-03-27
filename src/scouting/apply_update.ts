import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';
import { history } from '../git/history.ts';
import { rank } from '../git/rank.ts';
import { seal } from '../git/seal.ts';
import type { GitContext } from '../lib/exec_git.ts';
import { execGit } from '../lib/exec_git.ts';
import { getProvenance } from '../provenance/get_provenance.ts';
import { updateProvenance } from '../provenance/update_provenance.ts';
import { fetchSkills } from './fetch_skills.ts';
import type { ApplyUpdateResult } from './types.ts';

export async function applyUpdate(
	root: string,
	db: GrimoireDb,
	spellPath: string,
): Promise<ApplyUpdateResult> {
	const prov = getProvenance(db, spellPath);
	if (!prov) {
		throw new GrimoireNotFoundError(`No provenance record for ${spellPath}`);
	}

	const source = prov.sourceUrl ?? prov.sourceRepo;
	if (!source) {
		throw new GrimoireNotFoundError(`Provenance for ${spellPath} has no source URL or repo`);
	}

	const ctx = { root };
	const localRank = rank(ctx, spellPath);

	const handle = await fetchSkills(source);

	try {
		const upstream = prov.sourcePath
			? handle.skills.find((s) => s.repoPath === prov.sourcePath)
			: handle.skills[0];

		if (!upstream) {
			throw new GrimoireNotFoundError(
				`Upstream skill not found for ${spellPath} (sourcePath: ${prov.sourcePath ?? 'none'})`,
			);
		}

		const upstreamContent = readFileSync(join(upstream.localPath, 'SKILL.md'), 'utf-8');

		if (localRank <= 1) {
			const targetPath = join(root, spellPath, 'SKILL.md');
			writeFileSync(targetPath, upstreamContent);

			const sealResult = seal(ctx, db, [spellPath], `update ${spellPath}`);
			const newRank = sealResult.ranks[spellPath] ?? localRank + 1;

			const commit = handle.resolvedCommit ?? prov.sourceCommit;
			updateProvenance(db, {
				spellPath: prov.spellPath,
				sourceType: prov.sourceType,
				...(prov.sourceUrl !== null ? { sourceUrl: prov.sourceUrl } : {}),
				...(prov.sourceRepo !== null ? { sourceRepo: prov.sourceRepo } : {}),
				...(prov.sourcePath !== null ? { sourcePath: prov.sourcePath } : {}),
				...(commit !== null && commit !== undefined ? { sourceCommit: commit } : {}),
				...(prov.sourceVersion !== null ? { sourceVersion: prov.sourceVersion } : {}),
			});

			return { applied: true, newRank };
		}

		const sealHistory = history(ctx, spellPath);
		const originalContent = resolveOriginalContent(ctx, spellPath, sealHistory);
		const currentContent = readFileSync(join(root, spellPath, 'SKILL.md'), 'utf-8');

		return {
			applied: false,
			reconciliation: {
				spellPath,
				originalContent,
				currentContent,
				upstreamContent,
				localRank,
				sealHistory,
			},
		};
	} finally {
		handle.cleanup();
	}
}

function resolveOriginalContent(
	ctx: GitContext,
	spellPath: string,
	sealHistory: Array<{ hash: string }>,
): string {
	if (sealHistory.length === 0) {
		try {
			return readFileSync(join(ctx.root, spellPath, 'SKILL.md'), 'utf-8');
		} catch {
			return '';
		}
	}

	const firstSeal = sealHistory[sealHistory.length - 1];
	if (!firstSeal) {
		return '';
	}

	try {
		return execGit(ctx, `show ${firstSeal.hash}:${spellPath}/SKILL.md`);
	} catch {
		try {
			return readFileSync(join(ctx.root, spellPath, 'SKILL.md'), 'utf-8');
		} catch {
			return '';
		}
	}
}
