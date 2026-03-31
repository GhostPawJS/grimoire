import type { GrimoireDb } from '../database.ts';
import type { CatalogueReadiness } from './types.ts';

export function catalogueReadiness(db: GrimoireDb): CatalogueReadiness {
	const row = db
		.prepare('SELECT computed_at FROM grimoire_health ORDER BY id DESC LIMIT 1')
		.get<{ computed_at: string }>();

	if (!row) {
		return {
			ready: true,
			reason: 'no_prior_run',
			lastCatalogueAt: null,
			newNotesSince: 0,
			newEventsSince: 0,
		};
	}

	const lastEpoch = new Date(row.computed_at).getTime();

	const newNotes = Number(
		db
			.prepare(
				"SELECT COUNT(*) as cnt FROM spell_notes WHERE status = 'pending' AND created_at > ?",
			)
			.get<{ cnt: number }>(lastEpoch)?.cnt ?? 0,
	);

	const newEvents = Number(
		db
			.prepare('SELECT COUNT(*) as cnt FROM spell_events WHERE ts > ?')
			.get<{ cnt: number }>(lastEpoch)?.cnt ?? 0,
	);

	if (newNotes > 0) {
		return {
			ready: true,
			reason: 'new_notes',
			lastCatalogueAt: row.computed_at,
			newNotesSince: newNotes,
			newEventsSince: newEvents,
		};
	}

	if (newEvents > 0) {
		return {
			ready: true,
			reason: 'new_events',
			lastCatalogueAt: row.computed_at,
			newNotesSince: 0,
			newEventsSince: newEvents,
		};
	}

	return {
		ready: false,
		reason: 'idle',
		lastCatalogueAt: row.computed_at,
		newNotesSince: 0,
		newEventsSince: 0,
	};
}
