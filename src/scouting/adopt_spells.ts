import type { GrimoireDb } from '../database.ts';
import { adoptSpell } from './adopt_spell.ts';
import type { AdoptResult, AdoptSpellOptions } from './types.ts';

export function adoptSpells(
	root: string,
	db: GrimoireDb | undefined,
	localPaths: string[],
	options?: AdoptSpellOptions,
): AdoptResult {
	const result: AdoptResult = { adopted: [], skipped: [], errors: [] };

	for (const localPath of localPaths) {
		try {
			const adopted = adoptSpell(root, db, localPath, options);
			result.adopted.push(adopted);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			result.errors.push({ path: localPath, error: message });
		}
	}

	return result;
}
