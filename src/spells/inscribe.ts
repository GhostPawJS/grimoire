import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { GrimoireConflictError, GrimoireValidationError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { seal } from '../git/seal.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { assertChapter, assertSpellName, resolveInsideRoot } from '../lib/safe_path.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { withTransaction } from '../with_transaction.ts';
import { discoverSpells } from './discover_spells.ts';
import { getSpell } from './get_spell.ts';
import type { DuplicationWarning, InscribeInput, InscribeResult } from './types.ts';

export function inscribe(
	root: string,
	db: GrimoireDb | undefined,
	input: InscribeInput,
): InscribeResult {
	return withGitLock(resolveGitDir(root, input.gitDir), () => {
		const gitCtx = { root, ...(input.gitDir ? { gitDir: input.gitDir } : {}) };
		if (hasGitRepository(gitCtx)) assertGitScope(gitCtx, []);
		const validation = validateSkillMd(input.content);
		if (!validation.valid) {
			throw new GrimoireValidationError(
				`Invalid SKILL.md content: ${validation.errors.join('; ')}`,
			);
		}

		const parsed = parseSkillMd(input.content);
		if (!parsed.ok) {
			throw new GrimoireValidationError(`Failed to parse SKILL.md: ${parsed.error}`);
		}

		if (parsed.frontmatter.name !== input.name)
			throw new GrimoireValidationError(
				'Frontmatter name must match the spell name. Change the name or content and retry.',
			);
		const chapter = input.chapter ?? DEFAULTS.defaultChapter;
		const path = `${chapter}/${input.name}`;
		assertChapter(chapter);
		assertSpellName(input.name);
		const absolutePath = resolveInsideRoot(root, chapter, input.name);
		resolveInsideRoot(root, chapter, input.name, 'SKILL.md');
		if (existsSync(absolutePath) && input.force !== true) throw new GrimoireConflictError(path);

		if (
			input.force &&
			existsSync(join(absolutePath, 'SKILL.md')) &&
			readFileSync(join(absolutePath, 'SKILL.md'), 'utf8') === input.content &&
			committedContentMatches(gitCtx, path, input.content)
		)
			return { spell: getSpell(root, path, undefined, input.gitDir), warnings: [], noOp: true };
		mkdirSync(absolutePath, { recursive: true });
		writeFileSync(join(absolutePath, 'SKILL.md'), input.content);

		const warnings = detectDuplicates(root, path, parsed.frontmatter.description);

		if (isGitAvailable()) {
			seal(
				{
					root,
					...(input.gitDir !== undefined ? { gitDir: input.gitDir } : {}),
				},
				db,
				[path],
				`inscribe ${path}`,
			);
		}

		const perform = (): InscribeResult => {
			if (db) {
				logEvent(db, {
					spell: path,
					event: 'inscribe',
					...(input.now !== undefined ? { now: input.now } : {}),
				});
			}
			const spell = getSpell(root, path, undefined, input.gitDir);
			return { spell, warnings };
		};

		return db ? withTransaction(db, perform) : perform();
	});
}

function detectDuplicates(
	root: string,
	newPath: string,
	newDescription: string,
): DuplicationWarning[] {
	const warnings: DuplicationWarning[] = [];
	const existing = discoverSpells(root);

	for (const entry of existing) {
		if (entry.path === newPath) continue;
		try {
			const content = readFileSync(join(root, entry.path, 'SKILL.md'), 'utf-8');
			const parsed = parseSkillMd(content);
			if (!parsed.ok) continue;
			const similarity = trigramJaccard(newDescription, parsed.frontmatter.description);
			if (similarity >= DEFAULTS.routingThreshold) {
				warnings.push({ existingPath: entry.path, similarity });
			}
		} catch {}
	}

	return warnings;
}

function committedContentMatches(
	ctx: { root: string; gitDir?: string },
	path: string,
	content: string,
): boolean {
	if (!hasGitRepository(ctx)) return true;
	try {
		return execGit(ctx, ['show', `HEAD:${path}/SKILL.md`]) === content.trim();
	} catch {
		return false;
	}
}
