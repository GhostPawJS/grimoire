import type { HistoryEntry } from '../git/types.ts';
import type { Provenance, ProvenanceInput } from '../provenance/types.ts';
import type { DuplicationWarning, Spell } from '../spells/types.ts';

export type ResolvedSource = {
	type: 'github' | 'agentskillhub' | 'local' | 'git';
	url?: string;
	owner?: string;
	repo?: string;
	ref?: string;
	subpath?: string;
	slug?: string;
};

export type DiscoveredSkill = {
	name: string;
	description: string;
	localPath: string;
	repoPath?: string;
	valid: boolean;
	errors: string[];
	warnings: string[];
};

export type FetchHandle = {
	source: string;
	resolvedRepo?: string;
	resolvedCommit?: string;
	skills: DiscoveredSkill[];
	cleanup: () => void;
};

export type AdoptSpellOptions = {
	chapter?: string;
	provenance?: ProvenanceInput;
	now?: number;
	gitDir?: string;
};

export type AdoptSpellResult = {
	spell: Spell;
	warnings: DuplicationWarning[];
	provenance?: Provenance;
};

export type AdoptResult = {
	adopted: AdoptSpellResult[];
	skipped: string[];
	errors: Array<{ path: string; error: string }>;
};

export type ScoutOptions = {
	chapter?: string;
	filter?: (skill: DiscoveredSkill) => boolean;
};

export type ScoutResult = {
	imported: AdoptSpellResult[];
	skipped: string[];
	errors: Array<{ path: string; error: string }>;
};

export type UpdateCheck = {
	spellPath: string;
	provenance: Provenance;
	latestCommit?: string;
	hasLocalEvolution: boolean;
	localRank: number;
};

export type Reconciliation = {
	spellPath: string;
	originalContent: string;
	currentContent: string;
	upstreamContent: string;
	localRank: number;
	sealHistory: HistoryEntry[];
};

export type ApplyUpdateResult =
	| { applied: true; newRank: number }
	| { applied: false; reconciliation: Reconciliation };
