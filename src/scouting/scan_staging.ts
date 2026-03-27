import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import type { DiscoveredSkill } from './types.ts';

export function scanStaging(dir: string): DiscoveredSkill[] {
	const results: DiscoveredSkill[] = [];
	walk(dir, dir, results);
	return results;
}

function walk(current: string, root: string, results: DiscoveredSkill[]): void {
	if (!existsSync(current)) return;

	const entries = readdirSync(current, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const full = join(current, entry.name);

		if (!entry.isDirectory()) continue;

		const skillMdPath = join(full, 'SKILL.md');
		if (existsSync(skillMdPath)) {
			const content = readFileSync(skillMdPath, 'utf-8');
			const validation = validateSkillMd(content);
			const parsed = parseSkillMd(content);
			const relPath = relative(root, full);

			if (parsed.ok) {
				results.push({
					name: parsed.frontmatter.name,
					description: parsed.frontmatter.description,
					localPath: full,
					repoPath: relPath,
					valid: validation.valid,
					errors: validation.errors,
					warnings: validation.warnings,
				});
			} else {
				results.push({
					name: entry.name,
					description: '',
					localPath: full,
					repoPath: relPath,
					valid: false,
					errors: [parsed.error],
					warnings: [],
				});
			}
		} else {
			walk(full, root, results);
		}
	}
}
