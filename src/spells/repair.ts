import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { commitIdentity } from '../git/commit_identity.ts';
import { hasGitRepository } from '../git/has_git_repository.ts';
import { seal } from '../git/seal.ts';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { serializeSkillMd } from '../spec/serialize_skill_md.ts';
import { assertSpellExists } from './assert_spell_exists.ts';
import type { RepairFix, RepairResult } from './types.ts';

export function repair(root: string, path: string, options?: { gitDir?: string }): RepairResult {
	return withGitLock(resolveGitDir(root, options?.gitDir), () => {
		const ctx = { root, ...(options?.gitDir ? { gitDir: options.gitDir } : {}) };
		resolveSpellPath(root, path);
		validateStagingPaths(root, [path]);
		if (hasGitRepository(ctx)) {
			assertGitScope(ctx, []);
			if (!existsSync(join(root, path)) && execGit(ctx, ['ls-files', '--', `${path}/`])) {
				execGit(ctx, ['rm', '--cached', '-r', '--quiet', '--', path]);
				execGit(ctx, [
					...commitIdentity(ctx),
					'commit',
					'-m',
					`repair missing ${path}`,
					'--',
					path,
				]);
				return {
					path,
					fixes: [{ code: 'tracked-missing', description: 'Untracked missing spell' }],
				};
			}
		}
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
