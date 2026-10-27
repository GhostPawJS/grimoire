import { existsSync, statSync } from 'node:fs';
import { GrimoireNotFoundError } from '../errors.ts';
import { resolveInsideRoot, resolveSpellPath } from '../lib/safe_path.ts';

export function assertSpellExists(root: string, path: string): void {
	const spellDir = resolveSpellPath(root, path);
	if (!existsSync(spellDir) || !statSync(spellDir).isDirectory()) {
		throw new GrimoireNotFoundError(`Spell directory not found: ${path}`);
	}
	const skillMd = resolveInsideRoot(root, path, 'SKILL.md');
	if (!existsSync(skillMd)) {
		throw new GrimoireNotFoundError(`SKILL.md not found in spell: ${path}`);
	}
}
