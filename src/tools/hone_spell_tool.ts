import { seal } from '../git/seal.ts';
import { tierInfo } from '../git/tier_info.ts';
import type { TierInfo } from '../git/types.ts';
import { translateToolError } from './tool_errors.ts';
import { arraySchema, defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { honeSpellToolName } from './tool_names.ts';
import { inspectSpellNext, reviewViewNext } from './tool_next.ts';
import { toSpellPathRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolNoOp, toolSuccess } from './tool_types.ts';

type HoneInput = { paths?: string[]; message?: string };
type HoneData = {
	commitHash: string;
	sealedPaths: string[];
	ranks: Record<string, number>;
	tiers: Record<string, TierInfo>;
};

export const honeSpellTool = defineGrimoireTool<HoneInput, ToolResult<HoneData>>({
	name: honeSpellToolName,
	description: 'Seal pending spell changes into a git commit, advancing spell ranks.',
	whenToUse: 'After editing spell content, to checkpoint changes and evolve spell tiers.',
	whenNotToUse: 'When no changes have been made — the tool will return a no-op.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		paths: 'Optional list of spell paths to seal. If omitted, seals all pending changes.',
		message: 'Optional commit message. Auto-generated if omitted.',
	},
	outputDescription:
		'The commit hash, sealed paths, resulting ranks, and computed tier info for each.',
	inputSchema: objectSchema(
		{
			paths: arraySchema(stringSchema('Spell path'), 'Spell paths to seal'),
			message: stringSchema('Commit message'),
		},
		[],
	),
	handler(ctx, input) {
		try {
			const gitCtx = { root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) };
			const result = seal(gitCtx, ctx.db, input.paths, input.message);

			if (result.sealedPaths.length === 0) {
				return toolNoOp('No pending changes to seal.', {
					commitHash: '',
					sealedPaths: [],
					ranks: {},
					tiers: {},
				});
			}

			const tiers: Record<string, TierInfo> = {};
			const entities: ToolEntityRef[] = [];
			const next: ToolNextStepHint[] = [];

			for (const p of result.sealedPaths) {
				const r = result.ranks[p] ?? 0;
				const ti = tierInfo(r);
				tiers[p] = ti;
				entities.push(toSpellPathRef(p, undefined, ti.tier));
				if (ti.sealsToNextTier <= 1) {
					next.push(inspectSpellNext(p, undefined));
				}
			}

			next.push(reviewViewNext('health'));

			return toolSuccess(
				`Sealed ${result.sealedPaths.length} spell(s) in commit ${result.commitHash.slice(0, 8)}.`,
				{
					commitHash: result.commitHash,
					sealedPaths: result.sealedPaths,
					ranks: result.ranks,
					tiers,
				},
				{ entities, next },
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
