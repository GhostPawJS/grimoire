import { discoverSpells } from '../spells/discover_spells.ts';
import type { SpellValidationResult } from './types.ts';
import { validate } from './validate.ts';

export function validateAll(root: string): SpellValidationResult[] {
	const spells = discoverSpells(root);
	return spells.map((spell) => validate(root, spell.path));
}
