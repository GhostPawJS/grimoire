import type { Tier } from '../git/types.ts';

export type IndexEntry = {
	path: string;
	chapter: string;
	name: string;
	tier: Tier;
	rank: number;
	description: string;
};

export type IndexOptions = {
	chapters?: string[];
	gitDir?: string;
};
