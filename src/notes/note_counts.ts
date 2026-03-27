import type { GrimoireDb } from '../database.ts';
import type { NoteCountRecord } from './types.ts';

export function noteCounts(db: GrimoireDb): NoteCountRecord[] {
	return db
		.prepare('SELECT source, domain, COUNT(*) as count FROM spell_notes GROUP BY source, domain')
		.all<{ source: string; domain: string | null; count: number }>()
		.map((row) => ({
			source: String(row.source),
			domain: row.domain !== null ? String(row.domain) : null,
			count: Number(row.count),
		}));
}
