import { join } from 'node:path';
import { tier } from '../git/tier.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import type { SkillMdParseResult } from '../spec/types.ts';
import type { DiscoveredSpell } from './discover_spells.ts';
import { scanSpellDir } from './scan_spell_dir.ts';
import type { Spell } from './types.ts';

export function spellFromContent(
	root: string,
	entry: DiscoveredSpell,
	content: string,
	parsed: Extract<SkillMdParseResult, { ok: true }>,
	rank: number,
): Spell {
	const absolutePath = join(root, entry.path);
	return {
		name: entry.name,
		chapter: entry.chapter,
		path: entry.path,
		absolutePath,
		skillMdPath: join(absolutePath, 'SKILL.md'),
		description: parsed.frontmatter.description,
		body: parsed.body,
		bodyLines: countBodyLines(content),
		rank,
		tier: tier(rank),
		files: scanSpellDir(absolutePath),
		frontmatter: parsed.frontmatter,
	};
}
