import type { GrimoireDb } from '../database.ts';
import type { ProvenanceInput } from './types.ts';

export function recordProvenance(db: GrimoireDb, input: ProvenanceInput): void {
	const now = new Date().toISOString();
	db.prepare(
		'INSERT INTO spell_provenance (spell_path, source_type, source_url, source_repo, source_path, source_commit, source_version, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
	).run(
		input.spellPath,
		input.sourceType,
		input.sourceUrl ?? null,
		input.sourceRepo ?? null,
		input.sourcePath ?? null,
		input.sourceCommit ?? null,
		input.sourceVersion ?? null,
		now,
	);
}
