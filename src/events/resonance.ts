import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { resolveNow } from '../resolve_now.ts';
import type { ResonanceColor, ResonanceOptions, ResonanceResult } from './types.ts';

const MS_PER_DAY = 86_400_000;

function colorFromWeight(w: number): ResonanceColor {
	if (w < 1.0) return 'grey';
	if (w < 3.0) return 'green';
	if (w < 6.0) return 'yellow';
	return 'orange';
}

export function resonance(
	db: GrimoireDb,
	path: string,
	options?: ResonanceOptions,
): ResonanceResult {
	const halfLife = options?.resonanceHalfLife ?? DEFAULTS.resonanceHalfLife;
	const now = resolveNow(options?.now);

	const sealRow = db
		.prepare(
			"SELECT ts FROM spell_events WHERE spell = ? AND event = 'seal' ORDER BY id DESC LIMIT 1",
		)
		.get<{ ts: number }>(path);

	const lastSealTs = sealRow ? Number(sealRow.ts) : null;

	const readRows =
		lastSealTs !== null
			? db
					.prepare(
						"SELECT ts FROM spell_events WHERE spell = ? AND event = 'read' AND ts > ? ORDER BY id",
					)
					.all<{ ts: number }>(path, lastSealTs)
			: db
					.prepare("SELECT ts FROM spell_events WHERE spell = ? AND event = 'read' ORDER BY id")
					.all<{ ts: number }>(path);

	let weightedReads = 0;
	for (const row of readRows) {
		const daysSince = (now - Number(row.ts)) / MS_PER_DAY;
		weightedReads += Math.exp(-daysSince / halfLife);
	}

	return {
		color: colorFromWeight(weightedReads),
		weightedReads,
		readCount: readRows.length,
		lastSealTs,
	};
}
