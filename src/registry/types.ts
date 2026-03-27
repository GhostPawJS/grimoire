export type RegistrySource = 'agentskillhub' | 'github';

export type RegistryEntryRow = {
	id: number;
	source: string;
	slug: string;
	name: string;
	description: string | null;
	adoption_count: number | null;
	source_repo: string | null;
	source_path: string | null;
	fetch_url: string | null;
	last_seen: string;
};

export interface RegistryEntry {
	id: number;
	source: RegistrySource;
	slug: string;
	name: string;
	description: string | null;
	adoptionCount: number | null;
	sourceRepo: string | null;
	sourcePath: string | null;
	fetchUrl: string | null;
	lastSeen: string;
}

export interface UpsertRegistryEntryInput {
	source: RegistrySource;
	slug: string;
	name: string;
	description?: string;
	adoptionCount?: number;
	sourceRepo?: string;
	sourcePath?: string;
	fetchUrl?: string;
}

export type SearchResult = {
	source: RegistrySource;
	slug: string;
	name: string;
	description: string;
	adoptionCount?: number;
	sourceRepo: string;
	sourcePath?: string;
	fetchUrl: string;
};

export type SearchSkillsOptions = {
	sources?: Array<'agentskillhub' | 'github'>;
	limit?: number;
};

export type RepoAnalysis = {
	repo: string;
	branch: string;
	skills: Array<{
		name: string;
		path: string;
		description: string;
		alreadyImported?: boolean;
	}>;
};

export type RefreshIndexOptions = {
	searchTerms?: string[];
};
