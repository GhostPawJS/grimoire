import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type DiscoveredSpell = {
	name: string;
	chapter: string;
	path: string;
};

export function discoverSpells(root: string): DiscoveredSpell[] {
	if (!existsSync(root)) return [];

	const results: DiscoveredSpell[] = [];
	const chapters = readdirSync(root, { withFileTypes: true });

	for (const chapterEntry of chapters) {
		if (!chapterEntry.isDirectory() || chapterEntry.name.startsWith('.')) continue;

		const chapterDir = join(root, chapterEntry.name);
		const spells = readdirSync(chapterDir, { withFileTypes: true });

		for (const spellEntry of spells) {
			if (!spellEntry.isDirectory() || spellEntry.name.startsWith('.')) continue;

			const skillMdPath = join(chapterDir, spellEntry.name, 'SKILL.md');
			if (existsSync(skillMdPath)) {
				results.push({
					name: spellEntry.name,
					chapter: chapterEntry.name,
					path: `${chapterEntry.name}/${spellEntry.name}`,
				});
			}
		}
	}

	return results;
}
