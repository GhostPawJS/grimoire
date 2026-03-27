import type { SkillMdFrontmatter } from './types.ts';

const hyphenatedToCamel: Record<string, string> = {
	'allowed-tools': 'allowedTools',
	'disable-model-invocation': 'disableModelInvocation',
};

export function normalizeFrontmatter(raw: Record<string, unknown>): SkillMdFrontmatter {
	const mapped: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(raw)) {
		const normalized = hyphenatedToCamel[key] ?? key;
		mapped[normalized] = value;
	}

	const result: SkillMdFrontmatter = {
		name: String(mapped.name ?? ''),
		description: String(mapped.description ?? ''),
	};

	if (mapped.license !== undefined) {
		result.license = String(mapped.license);
	}

	if (mapped.compatibility !== undefined) {
		result.compatibility = String(mapped.compatibility);
	}

	if (mapped.allowedTools !== undefined) {
		result.allowedTools = String(mapped.allowedTools);
	}

	if (mapped.disableModelInvocation !== undefined) {
		result.disableModelInvocation = Boolean(mapped.disableModelInvocation);
	}

	if (
		mapped.metadata !== undefined &&
		typeof mapped.metadata === 'object' &&
		mapped.metadata !== null
	) {
		const coerced: Record<string, string> = {};
		for (const [k, v] of Object.entries(mapped.metadata as Record<string, unknown>)) {
			if (typeof v === 'string') {
				coerced[k] = v;
			}
		}
		result.metadata = coerced;
	}

	return result;
}
