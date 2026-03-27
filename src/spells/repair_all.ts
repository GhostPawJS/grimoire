import { discoverSpells } from './discover_spells.ts';
import { repair } from './repair.ts';
import type { RepairResult } from './types.ts';

export function repairAll(root: string): RepairResult[] {
	const spells = discoverSpells(root);
	return spells.map((s) => repair(root, s.path));
}
