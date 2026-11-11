import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allRanks } from '../git/all_ranks.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { discoverSpells } from './discover_spells.ts';
import { spellFromContent } from './spell_from_content.ts';
import type { ListSpellsOptions, Spell } from './types.ts';

export function listSpells(root: string, options?: ListSpellsOptions): Spell[] {
	const discovered = discoverSpells(root);
	const ranks = isGitAvailable() ? allRanks({ root }) : {};

	const results: Spell[] = [];
	for (const entry of discovered) {
		if (options?.chapters && !options.chapters.includes(entry.chapter)) continue;

		const absolutePath = join(root, entry.path);
		const skillMdPath = join(absolutePath, 'SKILL.md');
		const content = readFileSync(skillMdPath, 'utf-8');
		const parsed = parseSkillMd(content);

		if (!parsed.ok) continue;

		const rank = ranks[entry.path] ?? 0;

		results.push(spellFromContent(root, entry, content, parsed, rank));
	}

	return results;
}
