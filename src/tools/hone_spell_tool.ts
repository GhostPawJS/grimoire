import { seal } from '../git/seal.ts';
import { tierInfo } from '../git/tier_info.ts';
import type { TierInfo } from '../git/types.ts';
import { distill } from '../notes/distill.ts';
import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	defineGrimoireTool,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { honeSpellToolName } from './tool_names.ts';
import { inspectSpellNext, reviewViewNext } from './tool_next.ts';
import { toSpellPathRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolNextStepHint, ToolResult, ToolWarning } from './tool_types.ts';
import { toolNoOp, toolSuccess, toolWarning } from './tool_types.ts';

type HoneInput = { paths?: string[]; message?: string; note_ids?: number[] };
type HoneData = {
	commitHash: string;
	sealedPaths: string[];
	ranks: Record<string, number>;
	tiers: Record<string, TierInfo>;
	distilledNoteIds: number[];
};

export const honeSpellTool = defineGrimoireTool<HoneInput, ToolResult<HoneData>>({
	name: honeSpellToolName,
	description: 'Seal pending spell changes into a git commit, advancing spell ranks.',
	whenToUse:
		'After editing spell content with update_spell, to checkpoint changes and evolve spell tiers. Pass note_ids to mark which notes were absorbed during this honing session.',
	whenNotToUse: 'When no changes have been made — the tool will return a no-op.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		paths: 'Optional list of spell paths to seal. If omitted, seals all pending changes.',
		message: 'Optional commit message. Auto-generated if omitted.',
		note_ids:
			'Optional list of note IDs to mark as distilled after sealing. Use when note evidence was incorporated into the spell during this session.',
	},
	outputDescription:
		'The commit hash, sealed paths, resulting ranks, tier info, and any note IDs that were distilled.',
	inputSchema: objectSchema(
		{
			paths: arraySchema(stringSchema('Spell path'), 'Spell paths to seal'),
			message: stringSchema('Commit message'),
			note_ids: arraySchema(integerSchema('Note ID'), 'Note IDs to distill after sealing'),
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
					distilledNoteIds: [],
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

			// Distill notes that were absorbed during this honing session.
			const distilledNoteIds: number[] = [];
			const warnings: ToolWarning[] = [];

			if (input.note_ids && input.note_ids.length > 0) {
				if (!ctx.db) {
					warnings.push(
						toolWarning(
							'degraded_no_db',
							'note_ids provided but no database available — notes were not distilled.',
						),
					);
				} else {
					const primaryPath = result.sealedPaths[0] ?? '';
					for (const noteId of input.note_ids) {
						try {
							distill(ctx.db, noteId, primaryPath);
							distilledNoteIds.push(noteId);
						} catch {
							warnings.push(
								toolWarning(
									'invalid_state',
									`Note #${noteId} could not be distilled (not found or already distilled).`,
								),
							);
						}
					}
				}
			}

			const noteSuffix =
				distilledNoteIds.length > 0 ? ` Distilled ${distilledNoteIds.length} note(s).` : '';

			return toolSuccess(
				`Sealed ${result.sealedPaths.length} spell(s) in commit ${result.commitHash.slice(0, 8)}.${noteSuffix}`,
				{
					commitHash: result.commitHash,
					sealedPaths: result.sealedPaths,
					ranks: result.ranks,
					tiers,
					distilledNoteIds,
				},
				{ entities, next, warnings },
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
