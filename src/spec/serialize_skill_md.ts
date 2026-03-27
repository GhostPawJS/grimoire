import type { SkillMdFrontmatter } from './types.ts';

const camelToHyphenated: Record<string, string> = {
	allowedTools: 'allowed-tools',
	disableModelInvocation: 'disable-model-invocation',
};

export function serializeSkillMd(frontmatter: SkillMdFrontmatter, body: string): string {
	const lines: string[] = ['---'];

	appendField(lines, 'name', frontmatter.name);
	appendField(lines, 'description', frontmatter.description);

	if (frontmatter.license !== undefined) {
		appendField(lines, 'license', frontmatter.license);
	}

	if (frontmatter.compatibility !== undefined) {
		appendField(lines, 'compatibility', frontmatter.compatibility);
	}

	if (frontmatter.allowedTools !== undefined) {
		appendField(lines, camelToHyphenated.allowedTools ?? 'allowed-tools', frontmatter.allowedTools);
	}

	if (frontmatter.disableModelInvocation !== undefined) {
		appendField(
			lines,
			camelToHyphenated.disableModelInvocation ?? 'disable-model-invocation',
			String(frontmatter.disableModelInvocation),
		);
	}

	if (frontmatter.metadata !== undefined) {
		lines.push('metadata:');
		for (const [key, value] of Object.entries(frontmatter.metadata)) {
			lines.push(`  ${key}: ${value}`);
		}
	}

	lines.push('---');
	lines.push('');
	lines.push(body);

	return lines.join('\n');
}

function appendField(lines: string[], key: string, value: string): void {
	lines.push(`${key}: ${value}`);
}
