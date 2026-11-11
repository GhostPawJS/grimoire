import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { assertSpellName } from '../lib/safe_path.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import type { DiscoveredSkill } from './types.ts';

export function scanStaging(dir: string, options?: { strict?: boolean }): DiscoveredSkill[] {
	const results: DiscoveredSkill[] = [];
	const direct = join(dir, 'SKILL.md');
	if (
		existsSync(direct) &&
		!lstatSync(dir).isSymbolicLink() &&
		!lstatSync(direct).isSymbolicLink()
	) {
		results.push(readStagedSkill(dir, '', options, true));
	} else walk(dir, dir, results, options);
	return results;
}

function walk(
	current: string,
	root: string,
	results: DiscoveredSkill[],
	options?: { strict?: boolean },
): void {
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
			results.push(readStagedSkill(full, relative(root, full), options));
		} else {
			walk(full, root, results, options);
		}
	}
}

function readStagedSkill(
	localPath: string,
	repoPath: string,
	options?: { strict?: boolean },
	direct = false,
): DiscoveredSkill {
	const content = readFileSync(join(localPath, 'SKILL.md'), 'utf8');
	const parsed = parseSkillMd(content);
	const validation = validateSkillMd(content, options);
	return {
		name: parsed.ok ? parsed.frontmatter.name : basename(localPath),
		description: parsed.ok ? parsed.frontmatter.description : '',
		localPath,
		repoPath,
		valid: validation.valid,
		errors: parsed.ok || direct ? validation.errors : [parsed.error],
		warnings: parsed.ok || direct ? validation.warnings : [],
	};
}
