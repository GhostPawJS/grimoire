import type { GrimoireDb } from '../database.ts';
import { DEFAULTS } from '../defaults.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';

export function routeNotes(
	db: GrimoireDb,
	spellDescriptions: Map<string, string>,
	threshold?: number,
): number {
	const t = threshold ?? DEFAULTS.routingThreshold;

	const rows = db
		.prepare("SELECT id, content FROM spell_notes WHERE domain IS NULL AND status = 'pending'")
		.all<{ id: number; content: string }>();

	let routed = 0;

	for (const row of rows) {
		let bestPath: string | undefined;
		let bestScore = 0;

		for (const [path, description] of spellDescriptions) {
			const score = trigramJaccard(row.content, description);
			if (score > bestScore) {
				bestScore = score;
				bestPath = path;
			}
		}

		if (bestPath !== undefined && bestScore > t) {
			db.prepare('UPDATE spell_notes SET domain = ? WHERE id = ?').run(bestPath, row.id);
			routed++;
		}
	}

	return routed;
}
