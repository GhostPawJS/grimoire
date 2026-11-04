import type { GrimoireDb } from '../database.ts';
import { GrimoireValidationError } from '../errors.ts';
import { assertChapter } from '../lib/safe_path.ts';
import { adoptSpells } from './adopt_spells.ts';
import { fetchSkills } from './fetch_skills.ts';
import type { ScoutOptions, ScoutResult } from './types.ts';

export async function scout(
	root: string,
	db: GrimoireDb,
	source: string,
	options?: ScoutOptions,
): Promise<ScoutResult> {
	if (options?.chapter !== undefined) assertChapter(options.chapter);
	const handle = await fetchSkills(source, options);

	try {
		if (options?.strict) {
			const invalid = handle.skills.filter(
				(s) => !s.valid && (!options.filter || options.filter(s)),
			);
			if (invalid.length)
				throw new GrimoireValidationError(
					invalid.map((s) => `${s.localPath}: ${s.errors.join('; ')}`).join('; '),
				);
		}
		const filtered = options?.filter
			? handle.skills.filter(options.filter)
			: handle.skills.filter((s) => s.valid);

		const localPaths = filtered.map((s) => s.localPath);
		const adoptOpts = {
			...(options?.strict !== undefined ? { strict: options.strict } : {}),
			...(options?.chapter !== undefined ? { chapter: options.chapter } : {}),
			...(options?.gitDir ? { gitDir: options.gitDir } : {}),
		};
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
