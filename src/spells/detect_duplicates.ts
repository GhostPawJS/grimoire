import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULTS } from '../defaults.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { discoverSpells } from './discover_spells.ts';
import type { DuplicationWarning } from './types.ts';

export function detectDuplicates(
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
