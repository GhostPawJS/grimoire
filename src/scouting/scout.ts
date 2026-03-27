import type { GrimoireDb } from '../database.ts';
import { adoptSpells } from './adopt_spells.ts';
import { fetchSkills } from './fetch_skills.ts';
import type { ScoutOptions, ScoutResult } from './types.ts';

export async function scout(
	root: string,
	db: GrimoireDb,
	source: string,
	options?: ScoutOptions,
): Promise<ScoutResult> {
	const handle = await fetchSkills(source);

	try {
		const filtered = options?.filter
			? handle.skills.filter(options.filter)
			: handle.skills.filter((s) => s.valid);

		const localPaths = filtered.map((s) => s.localPath);
		const adoptOpts = options?.chapter !== undefined ? { chapter: options.chapter } : {};
		const result = adoptSpells(root, db, localPaths, adoptOpts);

		return {
			imported: result.adopted,
			skipped: result.skipped,
			errors: result.errors,
		};
	} finally {
		handle.cleanup();
	}
}
