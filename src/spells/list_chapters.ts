import { discoverSpells } from './discover_spells.ts';

export function listChapters(root: string): string[] {
	const spells = discoverSpells(root);
	const chapters = new Set<string>();
	for (const spell of spells) {
		chapters.add(spell.chapter);
	}
	return [...chapters].sort();
}
