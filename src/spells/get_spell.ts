import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { allRanks } from '../git/all_ranks.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { tier } from '../git/tier.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { assertSpellExists } from './assert_spell_exists.ts';
import { scanSpellDir } from './scan_spell_dir.ts';
import type { Spell } from './types.ts';

export function getSpell(root: string, path: string, db?: GrimoireDb, gitDir?: string): Spell {
	assertSpellExists(root, path);

	const sep = path.indexOf('/');
	const chapter = path.slice(0, sep);
	const name = path.slice(sep + 1);
	const absolutePath = join(root, path);
	const skillMdPath = join(absolutePath, 'SKILL.md');
	const content = readFileSync(skillMdPath, 'utf-8');
	const parsed = parseSkillMd(content);

	if (!parsed.ok) {
		throw new GrimoireNotFoundError(
			`Failed to parse SKILL.md for spell: ${path} — ${parsed.error}`,
		);
	}

	const ranks = isGitAvailable()
		? allRanks({ root, ...(gitDir !== undefined ? { gitDir } : {}) })
		: {};
	const rank = ranks[path] ?? 0;

	if (db) {
		logEvent(db, { spell: path, event: 'read' });
	}

	return {
		name,
		chapter,
		path,
		absolutePath,
		skillMdPath,
		description: parsed.frontmatter.description,
		body: parsed.body,
		bodyLines: countBodyLines(content),
		rank,
		tier: tier(rank),
		files: scanSpellDir(absolutePath),
		frontmatter: parsed.frontmatter,
	};
}
