import { normalizeFrontmatter } from './normalize_frontmatter.ts';
import { parseFrontmatterYaml } from './parse_frontmatter_yaml.ts';
import type { SkillMdParseResult } from './types.ts';

export function parseSkillMd(content: string): SkillMdParseResult {
	const firstDelim = content.indexOf('---');
	if (firstDelim === -1) {
		return { ok: false, error: 'Missing opening frontmatter delimiter (---)' };
	}

	const afterFirst = firstDelim + 3;
	const secondDelim = content.indexOf('\n---', afterFirst);
	if (secondDelim === -1) {
		return { ok: false, error: 'Missing closing frontmatter delimiter (---)' };
	}

	const yamlBlock = content.slice(afterFirst, secondDelim).trim();
	if (yamlBlock === '') {
		return { ok: false, error: 'Empty frontmatter block' };
	}

	const raw = parseFrontmatterYaml(yamlBlock);
	const frontmatter = normalizeFrontmatter(raw);
	const bodyStart = secondDelim + 4;
	const body =
		content[bodyStart] === '\n' ? content.slice(bodyStart + 1) : content.slice(bodyStart);

	return { ok: true, frontmatter, body };
}
