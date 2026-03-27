import { parseSkillMd } from './parse_skill_md.ts';
import type { SkillMdValidationResult } from './types.ts';

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSpellName(name: string): boolean {
	return name.length > 0 && name.length <= 64 && NAME_PATTERN.test(name);
}

const KNOWN_FIELDS = new Set([
	'name',
	'description',
	'license',
	'compatibility',
	'allowedTools',
	'allowed-tools',
	'disableModelInvocation',
	'disable-model-invocation',
	'metadata',
]);

export function validateSkillMd(content: string): SkillMdValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const parsed = parseSkillMd(content);

	if (!parsed.ok) {
		return { valid: false, errors: [parsed.error], warnings };
	}

	const { frontmatter, body } = parsed;

	if (!frontmatter.name || frontmatter.name.length === 0) {
		errors.push('name is required');
	} else {
		if (frontmatter.name.length > 64) {
			errors.push('name must be at most 64 characters');
		}
		if (!NAME_PATTERN.test(frontmatter.name)) {
			errors.push('name must match /^[a-z0-9]+(-[a-z0-9]+)*$/');
		}
	}

	if (!frontmatter.description || frontmatter.description.length === 0) {
		errors.push('description is required');
	} else if (frontmatter.description.length > 1024) {
		errors.push('description must be at most 1024 characters');
	}

	const bodyLines = body.split('\n');
	const nonEmptyLines = bodyLines.filter((line) => line.trim() !== '');
	if (nonEmptyLines.length === 0) {
		errors.push('body must have at least one non-empty line');
	}

	if (frontmatter.compatibility !== undefined && frontmatter.compatibility.length > 500) {
		errors.push('compatibility must be at most 500 characters');
	}

	if (frontmatter.metadata !== undefined) {
		for (const [_k, v] of Object.entries(frontmatter.metadata)) {
			if (typeof v !== 'string') {
				errors.push('metadata values must be strings');
				break;
			}
		}
	}

	if (bodyLines.length > 500) {
		warnings.push('body exceeds 500 lines');
	}

	checkUnknownFields(content, warnings);

	return { valid: errors.length === 0, errors, warnings };
}

function checkUnknownFields(content: string, warnings: string[]): void {
	const parsed = parseSkillMd(content);
	if (!parsed.ok) return;

	const firstDelim = content.indexOf('---');
	const afterFirst = firstDelim + 3;
	const secondDelim = content.indexOf('\n---', afterFirst);
	if (secondDelim === -1) return;

	const yamlBlock = content.slice(afterFirst, secondDelim);
	const lines = yamlBlock.split('\n');

	for (const line of lines) {
		if (line.trim() === '' || line.trim().startsWith('#')) continue;
		if (line.startsWith('  ') || line.startsWith('\t')) continue;

		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;

		const key = line.slice(0, colonIdx).trim();
		if (!KNOWN_FIELDS.has(key)) {
			warnings.push(`unknown frontmatter field: ${key}`);
		}
	}
}
