export type SkillMdFrontmatter = {
	name: string;
	description: string;
	license?: string;
	compatibility?: string;
	allowedTools?: string;
	disableModelInvocation?: boolean;
	metadata?: Record<string, string>;
};

export type SkillMdValidationResult = {
	valid: boolean;
	errors: string[];
	warnings: string[];
};

export type SkillMdParseResult =
	| { ok: true; frontmatter: SkillMdFrontmatter; body: string }
	| { ok: false; error: string };
