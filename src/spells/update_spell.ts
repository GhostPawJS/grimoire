import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GrimoireValidationError } from '../errors.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { assertSpellExists } from './assert_spell_exists.ts';

/**
 * Write new SKILL.md content to an existing spell, leaving the change
 * uncommitted. Call hone_spell / write.seal afterward to advance rank.
 */
export function updateSpell(root: string, path: string, content: string): void {
	const validation = validateSkillMd(content);
	if (!validation.valid) {
		throw new GrimoireValidationError(`Invalid SKILL.md content: ${validation.errors.join('; ')}`);
	}
	assertSpellExists(root, path);
	writeFileSync(join(root, path, 'SKILL.md'), content);
}
