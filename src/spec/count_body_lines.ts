import { parseSkillMd } from './parse_skill_md.ts';

export function countBodyLines(content: string): number {
	const parsed = parseSkillMd(content);

	if (!parsed.ok) {
		return content.split('\n').length;
	}

	return parsed.body.split('\n').length;
}
