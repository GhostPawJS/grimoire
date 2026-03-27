import type { GrimoireDb } from '../database.ts';
import { resonance } from './resonance.ts';
import type { ResonanceOptions, ResonanceResult } from './types.ts';

export function allResonance(
	db: GrimoireDb,
	options?: ResonanceOptions,
): Record<string, ResonanceResult> {
	const rows = db.prepare('SELECT DISTINCT spell FROM spell_events').all<{ spell: string }>();

	const result: Record<string, ResonanceResult> = {};
	for (const row of rows) {
		result[row.spell] = resonance(db, row.spell, options);
	}
	return result;
}
