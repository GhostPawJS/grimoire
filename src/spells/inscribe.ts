import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
import { withGitLock } from '../lib/with_git_lock.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { withTransaction } from '../with_transaction.ts';
import { detectDuplicates } from './detect_duplicates.ts';
import { getSpell } from './get_spell.ts';
import type { InscribeInput, InscribeResult } from './types.ts';
import { recordWrite } from './write_state.ts';

export function inscribe(
	root: string,
	db: GrimoireDb | undefined,
	input: InscribeInput,
): InscribeResult {
	return withGitLock(resolveGitDir(root, input.gitDir), () => {
		const gitCtx = { root, ...(input.gitDir ? { gitDir: input.gitDir } : {}) };
		if (hasGitRepository(gitCtx)) assertGitScope(gitCtx, []);
		const validation = validateSkillMd(input.content, input);
		if (!validation.valid) {
			throw new GrimoireValidationError(
				`Invalid SKILL.md content: ${validation.errors.join('; ')}`,
			);
		}

		// Successful validation guarantees that this same content parses.
		const parsed = parseSkillMd(input.content) as Extract<
			ReturnType<typeof parseSkillMd>,
			{ ok: true }
		>;

		if (parsed.frontmatter.name !== input.name)
			throw new GrimoireValidationError(
				'Frontmatter name must match the spell name. Change the name or content and retry.',
			);
		const chapter = input.chapter ?? DEFAULTS.defaultChapter;
		const path = `${chapter}/${input.name}`;
		assertChapter(chapter);
		assertSpellName(input.name);
		const absolutePath = resolveInsideRoot(root, chapter, input.name);
		if (existsSync(absolutePath) && input.force !== true) throw new GrimoireConflictError(path);
		if (!existsSync(absolutePath) || statSync(absolutePath).isDirectory())
			resolveInsideRoot(root, chapter, input.name, 'SKILL.md');

		if (
			input.force &&
			existsSync(join(absolutePath, 'SKILL.md')) &&
			readFileSync(join(absolutePath, 'SKILL.md'), 'utf8') === input.content &&
			committedContentMatches(gitCtx, path, input.content)
		)
			return { spell: getSpell(root, path, undefined, input.gitDir), warnings: [], noOp: true };
		if (input.force && existsSync(absolutePath) && !statSync(absolutePath).isDirectory())
			rmSync(absolutePath);
		mkdirSync(absolutePath, { recursive: true });
		writeFileSync(join(absolutePath, 'SKILL.md'), input.content);

		recordWrite(gitCtx, path, input.content);

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
