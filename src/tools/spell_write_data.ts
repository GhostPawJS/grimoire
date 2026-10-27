import { history } from '../git/history.ts';
import { getSpell } from '../spells/get_spell.ts';

export function spellWriteData(
	context: { root: string; gitDir?: string | undefined },
	path: string,
	verbose = false,
) {
	const ctx = { root: context.root, ...(context.gitDir ? { gitDir: context.gitDir } : {}) };
	const spell = getSpell(ctx.root, path, undefined, ctx.gitDir);
	return {
		path: spell.path,
		chapter: spell.chapter,
		name: spell.name,
		rank: spell.rank,
		tier: spell.tier,
		commit: history(ctx, path)[0]?.hash.slice(0, 8) ?? '',
		warnings: [],
		...(verbose ? { spell } : {}),
	};
}
