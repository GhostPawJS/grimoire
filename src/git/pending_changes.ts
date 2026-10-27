import { execGit } from '../lib/exec_git.ts';
import { resolveSpellPath } from '../lib/safe_path.ts';
import { isGitAvailable } from './is_git_available.ts';
import type { GitContext, PendingChange, PendingChangesResult } from './types.ts';

function classifyStatus(code: string): PendingChange['status'] | undefined {
	if (code === '??' || code === 'A ' || code === 'A') return 'created';
	if (code === 'M ' || code === ' M' || code === 'MM') return 'modified';
	if (code === 'D ' || code === ' D') return 'deleted';
	return undefined;
}

function statusPorcelain(ctx: GitContext): string {
	return execGit(ctx, ['status', '--porcelain', '-uall'], { trim: false });
}

export function pendingChanges(ctx: GitContext, path?: string): PendingChangesResult[] {
	if (path !== undefined) resolveSpellPath(ctx.root, path);
	if (!isGitAvailable()) return [];
	try {
		const output = statusPorcelain(ctx);
		if (output === '') return [];

		const bySpell = new Map<string, PendingChange[]>();

		for (const line of output.split('\n')) {
			if (line === '') continue;
			const statusCode = line.slice(0, 2);
			const filePath = line.slice(3);
			const parts = filePath.split('/');
			if (parts.length < 2) continue;

			const spellPath = `${parts[0]}/${parts[1]}`;
			if (path && spellPath !== path) continue;

			const status = classifyStatus(statusCode);
			if (!status) continue;

			const existing = bySpell.get(spellPath);
			if (existing) {
				existing.push({ status, filePath });
			} else {
				bySpell.set(spellPath, [{ status, filePath }]);
			}
		}

		return [...bySpell.entries()].map(([spellPath, changes]) => ({
			spellPath,
			changes,
		}));
	} catch {
		return [];
	}
}
