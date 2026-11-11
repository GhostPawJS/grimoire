import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { GrimoireValidationError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { seal } from '../git/seal.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { assertChapter, assertSpellName, resolveInsideRoot } from '../lib/safe_path.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { getProvenance } from '../provenance/get_provenance.ts';
import { recordProvenance } from '../provenance/record_provenance.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { serializeSkillMd } from '../spec/serialize_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { detectDuplicates } from '../spells/detect_duplicates.ts';
import { getSpell } from '../spells/get_spell.ts';
import { withTransaction } from '../with_transaction.ts';
import type { AdoptSpellOptions, AdoptSpellResult } from './types.ts';

export function adoptSpell(
	root: string,
	db: GrimoireDb | undefined,
	localPath: string,
	options?: AdoptSpellOptions,
): AdoptSpellResult {
	return withGitLock(resolveGitDir(root, options?.gitDir), () => {
		const gitCtx = { root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) };
		if (hasGitRepository(gitCtx)) assertGitScope(gitCtx, []);
		const skillMdPath = resolveInsideRoot(localPath, 'SKILL.md');
		if (!existsSync(skillMdPath)) {
			throw new GrimoireValidationError(`No SKILL.md found at ${localPath}`);
		}

		const content = readFileSync(skillMdPath, 'utf-8');
		const validation = validateSkillMd(content, options);
		if (!validation.valid) {
			throw new GrimoireValidationError(
				`Invalid SKILL.md at ${localPath}: ${validation.errors.join('; ')}`,
			);
		}

		// Successful validation guarantees that this same content parses.
		const parsed = parseSkillMd(content) as Extract<ReturnType<typeof parseSkillMd>, { ok: true }>;

		const name = parsed.frontmatter.name;
		const chapter = options?.chapter ?? DEFAULTS.defaultChapter;
		const spellPath = `${chapter}/${name}`;
		assertChapter(chapter);
		assertSpellName(name);
		const targetDir = resolveInsideRoot(root, chapter, name);

		if (existsSync(targetDir)) {
			throw new GrimoireValidationError(`Spell already exists at ${spellPath}`);
		}

		const warnings = detectDuplicates(root, spellPath, parsed.frontmatter.description);

		mkdirSync(join(root, chapter), { recursive: true });
		cpSync(localPath, targetDir, {
			recursive: true,
			dereference: false,
			filter: (source) =>
				!lstatSync(source).isSymbolicLink() &&
				!['.git', '.grimoire-git'].includes(basename(source)),
		});

		if (options?.provenance) {
			injectProvenanceMetadata(targetDir, options.provenance, options.now);
		}

		if (isGitAvailable()) {
			seal(
				{ root, ...(options?.gitDir !== undefined ? { gitDir: options.gitDir } : {}) },
				db,
				[spellPath],
				`adopt ${spellPath}`,
			);
		}

		const perform = (): AdoptSpellResult => {
			if (db) {
				if (options?.provenance) recordProvenance(db, { ...options.provenance, spellPath });
				logEvent(db, {
					spell: spellPath,
					event: 'adopt',
					...(options?.now !== undefined ? { now: options.now } : {}),
				});
			}
			const prov = db && options?.provenance ? getProvenance(db, spellPath) : undefined;
			return {
				spell: getSpell(root, spellPath, undefined, options?.gitDir),
				warnings,
				...(prov ? { provenance: prov } : {}),
			};
		};

		return db ? withTransaction(db, perform) : perform();
	});
}

function injectProvenanceMetadata(
	targetDir: string,
	provenance: NonNullable<AdoptSpellOptions['provenance']>,
	now?: number,
): void {
	const skillMdPath = join(targetDir, 'SKILL.md');
	const content = readFileSync(skillMdPath, 'utf-8');
	const parsed = parseSkillMd(content);
	if (!parsed.ok) return;

	const metadata: Record<string, string> = { ...parsed.frontmatter.metadata };

	if (provenance.sourceUrl) {
		metadata.source = provenance.sourceUrl;
	} else if (provenance.sourceRepo) {
		metadata.source = provenance.sourceRepo;
	}

	if (provenance.sourceVersion) {
		metadata.sourceVersion = provenance.sourceVersion;
	}

	metadata.importedAt = new Date(now ?? Date.now()).toISOString();

	const updated = serializeSkillMd({ ...parsed.frontmatter, metadata }, parsed.body);
	writeFileSync(skillMdPath, updated);
}
