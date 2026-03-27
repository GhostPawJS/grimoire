import type { Tier } from '../git/types.ts';
import type { SkillMdFrontmatter } from '../spec/types.ts';

export type SpellFiles = {
	scripts: string[];
	references: string[];
	assets: string[];
};

export type Spell = {
	name: string;
	chapter: string;
	path: string;
	absolutePath: string;
	skillMdPath: string;
	description: string;
	body: string;
	bodyLines: number;
	rank: number;
	tier: Tier;
	files: SpellFiles;
	frontmatter: SkillMdFrontmatter;
};

export type RenderedContent = {
	body: string;
	compiledSummary?: string;
	allowedTools?: string;
	tier: Tier;
	rank: number;
};

export type ListSpellsOptions = {
	chapters?: string[];
};

export type DuplicationWarning = {
	existingPath: string;
	similarity: number;
};

export type RepairFix = {
	code: string;
	description: string;
};

export type RepairResult = {
	path: string;
	fixes: RepairFix[];
};

export type InscribeInput = {
	name: string;
	chapter?: string;
	content: string;
	now?: number;
};

export type InscribeResult = {
	spell: Spell;
	warnings: DuplicationWarning[];
};
