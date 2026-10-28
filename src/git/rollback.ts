import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { assertGitScope } from '../lib/assert_git_scope.ts';
import { execGit } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { validateStagingPaths } from '../lib/validate_staging_paths.ts';
import { withGitLock } from '../lib/with_git_lock.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { serializeSkillMd } from '../spec/serialize_skill_md.ts';
import { hasGitRepository } from './has_git_repository.ts';
import { history } from './history.ts';
import { isGitAvailable } from './is_git_available.ts';
import { seal } from './seal.ts';
import type { GitContext, RollbackResult } from './types.ts';

const REF_PATTERN = /^[a-f0-9]{4,40}$/;

export function rollback(ctx: GitContext, path: string, ref: string): RollbackResult {
	return withGitLock(resolveGitDir(ctx.root, ctx.gitDir), () => {
		if (!REF_PATTERN.test(ref)) {
			return { success: false };
		}
		resolveSpellPath(ctx.root, path);
		if (!isGitAvailable() || !hasGitRepository(ctx)) {
			return { success: false };
		}
		assertGitScope(ctx, []);
		try {
			execGit(ctx, ['cat-file', '-e', `${ref}^{commit}`]);
			const hash = execGit(ctx, ['rev-parse', ref]);
			let historicalPath = path;
			for (const entry of history(ctx, path)) {
				if (entry.hash === hash) break;
				const move = /^move (\S+) -> (\S+)$/.exec(entry.message);
				if (move?.[2] === historicalPath) historicalPath = move[1] as string;
			}
			const tree = execGit(ctx, ['ls-tree', '-r', ref, '--', `${historicalPath}/`]);
			if (
				tree
					.split('\n')
					.some((line) => line && !line.startsWith('100644 ') && !line.startsWith('100755 '))
			)
				return { success: false };
			validateStagingPaths(ctx.root, [path]);
			if (!tree) return { success: false };
			rmSync(join(ctx.root, path), { recursive: true, force: true });
			for (const line of tree.split('\n')) {
				const file = line.slice(line.indexOf('\t') + 1);
				const target = join(ctx.root, path, file.slice(historicalPath.length + 1));
				mkdirSync(dirname(target), { recursive: true });
				let content = execFileSync('git', [
					'--git-dir',
					resolveGitDir(ctx.root, ctx.gitDir),
					'show',
					`${ref}:${file}`,
				]);
				if (file === `${historicalPath}/SKILL.md` && historicalPath !== path) {
					const parsed = parseSkillMd(content.toString('utf8'));
					if (parsed.ok)
						content = Buffer.from(
							serializeSkillMd(
								{ ...parsed.frontmatter, name: path.split('/')[1] ?? '' },
								parsed.body,
							),
						);
				}
				writeFileSync(target, content, { mode: line.startsWith('100755 ') ? 0o755 : 0o644 });
			}
		} catch {
			return { success: false };
		}
		seal(ctx, undefined, [path], `rollback ${path} to ${ref}\n\nGrimoire-Rollback: ${ref}`);
		return { success: true, restoredRef: ref };
	});
}
