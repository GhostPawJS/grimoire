import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execGit, type GitContext } from '../lib/exec_git.ts';
import { resolveGitDir } from '../lib/resolve_git_dir.ts';

function statePath(ctx: GitContext, path: string): string {
	return join(
		resolveGitDir(ctx.root, ctx.gitDir),
		'grimoire-writes',
		createHash('sha256').update(path).digest('hex'),
	);
}
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export function recordWrite(ctx: GitContext, path: string, content: string): void {
	const file = statePath(ctx, path);
	mkdirSync(join(file, '..'), { recursive: true });
	writeFileSync(file, hash(content));
}
export function isDirectEdit(ctx: GitContext, path: string): boolean {
	const file = join(ctx.root, path, 'SKILL.md');
	if (!existsSync(file)) return false;
	const content = readFileSync(file, 'utf8');
	const state = statePath(ctx, path);
	if (existsSync(state)) return readFileSync(state, 'utf8') !== hash(content);
	try {
		return execGit(ctx, ['show', `HEAD:${path}/SKILL.md`]) !== content.trim();
	} catch {
		return true;
	}
}
