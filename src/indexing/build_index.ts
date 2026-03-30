import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allRanks } from '../git/all_ranks.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { tier } from '../git/tier.ts';
import { resolveGitDir } from '../lib/exec_git.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { discoverSpells } from '../spells/discover_spells.ts';
import type { IndexEntry, IndexOptions } from './types.ts';

export function buildIndex(root: string, options?: IndexOptions): IndexEntry[] {
	const spells = discoverSpells(root);
	const gitDir = resolveGitDir(root, options?.gitDir);
	const gitContext = isGitAvailable() && existsSync(gitDir);
	const ranks = gitContext ? allRanks({ root, gitDir }) : {};

	const entries: IndexEntry[] = [];

	for (const spell of spells) {
		const skillPath = join(root, spell.chapter, spell.name, 'SKILL.md');
		let content: string;
		try {
			content = readFileSync(skillPath, 'utf-8');
		} catch {
			continue;
		}

		const parsed = parseSkillMd(content);
		if (!parsed.ok) continue;

		const rank = ranks[spell.path] ?? 0;

		if (gitContext && rank <= 0) continue;

		if (options?.chapters && !options.chapters.includes(spell.chapter)) continue;

		entries.push({
			path: spell.path,
			chapter: spell.chapter,
			name: spell.name,
			tier: tier(rank),
			rank,
			description: parsed.frontmatter.description,
		});
	}

	entries.sort((a, b) => b.rank - a.rank || a.path.localeCompare(b.path));
	return entries;
}
