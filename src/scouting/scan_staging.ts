import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { assertSpellName } from '../lib/safe_path.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import type { DiscoveredSkill } from './types.ts';

export function scanStaging(dir: string): DiscoveredSkill[] {
	const results: DiscoveredSkill[] = [];
	const direct = join(dir, 'SKILL.md');
	if (
		existsSync(direct) &&
		!lstatSync(dir).isSymbolicLink() &&
		!lstatSync(direct).isSymbolicLink()
	) {
		const content = readFileSync(direct, 'utf8');
		const parsed = parseSkillMd(content);
		const validation = validateSkillMd(content);
		results.push({
			name: parsed.ok ? parsed.frontmatter.name : basename(dir),
			description: parsed.ok ? parsed.frontmatter.description : '',
			localPath: dir,
			repoPath: '',
			valid: validation.valid,
			errors: validation.errors,
			warnings: validation.warnings,
		});
	} else walk(dir, dir, results);
	return results;
}

function walk(current: string, root: string, results: DiscoveredSkill[]): void {
	if (!existsSync(current)) return;

	const entries = readdirSync(current, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const full = join(current, entry.name);

		if (!entry.isDirectory()) continue;

		try {
			assertSpellName(entry.name);
		} catch (error) {
			results.push({
				name: entry.name,
				description: '',
				localPath: full,
				repoPath: relative(root, full),
				valid: false,
				errors: [(error as Error).message],
				warnings: [],
			});
			continue;
		}
		const skillMdPath = join(full, 'SKILL.md');
		if (existsSync(skillMdPath) && !lstatSync(skillMdPath).isSymbolicLink()) {
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
