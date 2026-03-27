export type { GitContext } from '../lib/exec_git.ts';

export type Tier = 'Uncheckpointed' | 'Apprentice' | 'Journeyman' | 'Expert' | 'Master';

export type TierInfo = {
	tier: Tier;
	rank: number;
	sealsToNextTier: number;
};

export type SealResult = {
	commitHash: string;
	sealedPaths: string[];
	ranks: Record<string, number>;
};

export type RollbackResult = {
	success: boolean;
	restoredRef?: string;
};

export type PendingChange = {
	status: 'created' | 'modified' | 'deleted';
	filePath: string;
};

export type PendingChangesResult = {
	spellPath: string;
	changes: PendingChange[];
};

export type HistoryEntry = {
	hash: string;
	message: string;
	date: string;
	files: string[];
};
