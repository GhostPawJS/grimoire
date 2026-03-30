import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { GrimoireValidationError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { seal } from '../git/seal.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';
import { getProvenance } from '../provenance/get_provenance.ts';
import { recordProvenance } from '../provenance/record_provenance.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { serializeSkillMd } from '../spec/serialize_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { discoverSpells } from '../spells/discover_spells.ts';
import { getSpell } from '../spells/get_spell.ts';
import type { DuplicationWarning } from '../spells/types.ts';
import { withTransaction } from '../with_transaction.ts';
import type { AdoptSpellOptions, AdoptSpellResult } from './types.ts';

export function adoptSpell(
	root: string,
	db: GrimoireDb | undefined,
	localPath: string,
	options?: AdoptSpellOptions,
): AdoptSpellResult {
	const skillMdPath = join(localPath, 'SKILL.md');
	if (!existsSync(skillMdPath)) {
		throw new GrimoireValidationError(`No SKILL.md found at ${localPath}`);
	}

	const content = readFileSync(skillMdPath, 'utf-8');
	const validation = validateSkillMd(content);
	if (!validation.valid) {
		throw new GrimoireValidationError(
			`Invalid SKILL.md at ${localPath}: ${validation.errors.join('; ')}`,
		);
	}

	const parsed = parseSkillMd(content);
	if (!parsed.ok) {
		throw new GrimoireValidationError(`Failed to parse SKILL.md at ${localPath}: ${parsed.error}`);
	}

	const name = parsed.frontmatter.name;
	const chapter = options?.chapter ?? DEFAULTS.defaultChapter;
	const spellPath = `${chapter}/${name}`;
	const targetDir = join(root, chapter, name);

	if (existsSync(targetDir)) {
		throw new GrimoireValidationError(`Spell already exists at ${spellPath}`);
	}

	const warnings = detectDuplicates(root, spellPath, parsed.frontmatter.description);

	mkdirSync(join(root, chapter), { recursive: true });
	cpSync(localPath, targetDir, { recursive: true });

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
		if (db && options?.provenance) {
			recordProvenance(db, { ...options.provenance, spellPath });
			logEvent(db, {
				spell: spellPath,
				event: 'adopt',
				...(options.now !== undefined ? { now: options.now } : {}),
			});
			const prov = getProvenance(db, spellPath);
			return {
				spell: getSpell(root, spellPath, undefined, options?.gitDir),
				warnings,
				...(prov ? { provenance: prov } : {}),
			};
		}

		if (db) {
			logEvent(db, {
				spell: spellPath,
				event: 'adopt',
				...(options?.now !== undefined ? { now: options.now } : {}),
			});
		}

		return { spell: getSpell(root, spellPath, undefined, options?.gitDir), warnings };
	};

	return db ? withTransaction(db, perform) : perform();
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
		} catch {
			// Skip unreadable spells.
		}
	}

	return warnings;
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
