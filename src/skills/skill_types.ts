export interface GrimoireSkill {
	name: string;
	description: string;
	content: string;
}

export type GrimoireSkillRegistry = readonly GrimoireSkill[];

export function defineGrimoireSkill<TSkill extends GrimoireSkill>(skill: TSkill): TSkill {
	return skill;
}
