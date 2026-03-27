export type ProvenanceSourceType = 'agentskillhub' | 'github' | 'local';

export type ProvenanceRow = {
	spell_path: string;
	source_type: string;
	source_url: string | null;
	source_repo: string | null;
	source_path: string | null;
	source_commit: string | null;
	source_version: string | null;
	imported_at: string;
	updated_at: string | null;
};

export interface Provenance {
	spellPath: string;
	sourceType: ProvenanceSourceType;
	sourceUrl: string | null;
	sourceRepo: string | null;
	sourcePath: string | null;
	sourceCommit: string | null;
	sourceVersion: string | null;
	importedAt: string;
	updatedAt: string | null;
}

export interface ProvenanceInput {
	spellPath: string;
	sourceType: ProvenanceSourceType;
	sourceUrl?: string;
	sourceRepo?: string;
	sourcePath?: string;
	sourceCommit?: string;
	sourceVersion?: string;
}
