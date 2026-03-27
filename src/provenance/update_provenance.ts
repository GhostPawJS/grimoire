import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';
import type { ProvenanceInput } from './types.ts';

export function updateProvenance(db: GrimoireDb, input: ProvenanceInput): void {
	const now = new Date().toISOString();
	const result = db
		.prepare(
			'UPDATE spell_provenance SET source_type = ?, source_url = ?, source_repo = ?, source_path = ?, source_commit = ?, source_version = ?, updated_at = ? WHERE spell_path = ?',
		)
		.run(
			input.sourceType,
			input.sourceUrl ?? null,
			input.sourceRepo ?? null,
			input.sourcePath ?? null,
			input.sourceCommit ?? null,
			input.sourceVersion ?? null,
			now,
			input.spellPath,
		);
	if (Number(result.changes) === 0) {
		throw new GrimoireNotFoundError(`Provenance for ${input.spellPath} not found`);
	}
}
