import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { seal } from '../git/seal.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { serializeSkillMd } from '../spec/serialize_skill_md.ts';
import { assertSpellExists } from './assert_spell_exists.ts';
import type { RepairFix, RepairResult } from './types.ts';

export function repair(root: string, path: string, options?: { gitDir?: string }): RepairResult {
	return withGitLock(resolveGitDir(root, options?.gitDir), () => {
		assertSpellExists(root, path);

		const fixes: RepairFix[] = [];
		const absolutePath = join(root, path);
		const skillMdPath = join(absolutePath, 'SKILL.md');
		let content = readFileSync(skillMdPath, 'utf-8');

		const sep = path.indexOf('/');
		const dirName = path.slice(sep + 1);

		if (!content.includes('---')) {
			content = serializeSkillMd(
				{ name: dirName, description: `Auto-generated frontmatter for ${dirName}` },
				content,
			);
			writeFileSync(skillMdPath, content);
			fixes.push({ code: 'missing-frontmatter', description: 'Injected missing frontmatter' });
		}

		const parsed = parseSkillMd(content);
		if (parsed.ok && parsed.frontmatter.name !== dirName) {
			const corrected = serializeSkillMd({ ...parsed.frontmatter, name: dirName }, parsed.body);
			writeFileSync(skillMdPath, corrected);
			fixes.push({
				code: 'name-mismatch',
				description: `Corrected frontmatter name from "${parsed.frontmatter.name}" to "${dirName}"`,
			});
		}

		const nestedGit = join(absolutePath, '.git');
		if (existsSync(nestedGit)) {
			rmSync(nestedGit, { recursive: true, force: true });
			fixes.push({ code: 'nested-git', description: 'Removed nested .git directory' });
		}

		if (fixes.length)
			seal(
				{ root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) },
				undefined,
				[path],
				`repair ${path}`,
			);
		return { path, fixes };
	});
}
