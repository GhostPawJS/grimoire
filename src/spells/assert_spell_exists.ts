import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GrimoireNotFoundError } from '../errors.ts';

export function assertSpellExists(root: string, path: string): void {
	const spellDir = join(root, path);
	if (!existsSync(spellDir)) {
		throw new GrimoireNotFoundError(`Spell directory not found: ${path}`);
	}
	const skillMd = join(spellDir, 'SKILL.md');
	if (!existsSync(skillMd)) {
		throw new GrimoireNotFoundError(`SKILL.md not found in spell: ${path}`);
	}
}
