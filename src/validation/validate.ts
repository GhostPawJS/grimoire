import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULTS } from '../defaults.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { rank } from '../git/rank.ts';
import { tier } from '../git/tier.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { checkTierRequirements } from './check_tier_requirements.ts';
import type { SpellValidationResult, ValidationIssue } from './types.ts';

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validate(root: string, path: string): SpellValidationResult {
	const issues: ValidationIssue[] = [];
	const skillMdPath = join(root, path, 'SKILL.md');

	if (!existsSync(skillMdPath)) {
		return {
			path,
			valid: false,
			issues: [{ severity: 'error', code: 'missing-skill-md', message: 'SKILL.md not found' }],
		};
	}

	const content = readFileSync(skillMdPath, 'utf-8');

	const result = validateSkillMd(content);
	for (const error of result.errors) {
		issues.push({ severity: 'error', code: 'invalid-frontmatter', message: error });
	}
	for (const warning of result.warnings) {
		const code = warning.includes('unknown frontmatter field')
			? 'unknown-frontmatter-field'
			: 'invalid-frontmatter';
		issues.push({ severity: 'warning', code, message: warning });
	}

	const segments = path.split('/');
	const dirName = segments.at(-1) ?? path;

	const parsed = parseSkillMd(content);
	if (parsed.ok && parsed.frontmatter.name !== dirName) {
		issues.push({
			severity: 'error',
			code: 'name-mismatch',
			message: `frontmatter name "${parsed.frontmatter.name}" does not match directory "${dirName}"`,
		});
	}

	if (!NAME_PATTERN.test(dirName)) {
		issues.push({
			severity: 'error',
			code: 'invalid-name-format',
			message: `directory name "${dirName}" does not match [a-z0-9]+(-[a-z0-9]+)*`,
		});
	}

	if (!path.includes('/')) {
		issues.push({
			severity: 'error',
			code: 'no-chapter',
			message: 'spell must be inside a chapter directory',
		});
	}

	if (countBodyLines(content) > DEFAULTS.oversizeLines) {
		issues.push({
			severity: 'warning',
			code: 'oversize',
			message: `body exceeds ${DEFAULTS.oversizeLines} lines`,
		});
	}

	if (isGitAvailable() && parsed.ok) {
		const r = rank({ root }, path);
		const t = tier(r);
		const tierIssues = checkTierRequirements(parsed.body, t);
		issues.push(...tierIssues);
	}

	return {
		path,
		valid: !issues.some((i) => i.severity === 'error'),
		issues,
	};
}
