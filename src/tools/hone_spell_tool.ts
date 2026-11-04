import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { history } from '../git/history.ts';
import { seal } from '../git/seal.ts';
import { tierInfo } from '../git/tier_info.ts';
import type { TierInfo } from '../git/types.ts';
import { assertNoteIds } from '../notes/assert_note_ids.ts';
import { distill } from '../notes/distill.ts';
import { discoverSpells } from '../spells/discover_spells.ts';
import { isDirectEdit } from '../spells/write_state.ts';
import { sharedGitWarning } from './shared_git_warning.ts';
import { spellWriteData } from './spell_write_data.ts';
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

type HoneInput = {
	paths?: string[];
	message?: string;
	note_ids?: number[];
	noteIds?: number[];
	verbose?: boolean;
};
type HoneData = {
	spells?: ReturnType<typeof spellWriteData>[];
	commitHash: string;
	rollbackHash?: string;
	sealedPaths: string[];
	ranks: Record<string, number>;
	tiers: Record<string, TierInfo>;
	distilledNoteIds: number[];
};

export const honeSpellTool = defineGrimoireTool<HoneInput, ToolResult<HoneData>>({
	name: honeSpellToolName,
	description: 'Seal pending spell changes into a git commit, advancing spell ranks.',
	whenToUse: 'Checkpoint edits from update_spell; note_ids records absorbed notes.',
	whenNotToUse: 'No edits or absorbed notes.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		paths: 'Spell paths; omitted seals all pending changes.',
		message: 'Commit message.',
		note_ids: 'IDs of notes absorbed into this seal.',
	},
	outputDescription: 'Commit, sealed paths, ranks, tiers, and distilled note IDs.',
	inputSchema: objectSchema(
		{
			paths: arraySchema(stringSchema('Spell path'), 'Spell paths to seal'),
			verbose: { type: 'boolean', description: 'Include full spells.' },
			message: stringSchema('Commit message'),
			note_ids: arraySchema(integerSchema('Note ID'), 'Note IDs to distill after sealing'),
			noteIds: arraySchema(integerSchema('Note ID'), 'Alias of note_ids'),
		},
		[],
	),
	handler(ctx, input) {
		try {
			const noteIds = [...new Set([...(input.note_ids ?? []), ...(input.noteIds ?? [])])];
			if (ctx.db) assertNoteIds(ctx.db, noteIds);
			const gitCtx = { root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) };
			const directEdits = (
				input.paths ?? discoverSpells(ctx.root).map((spell) => spell.path)
			).filter((path) => isDirectEdit(gitCtx, path));
			const result = seal(gitCtx, ctx.db, input.paths, input.message);

			// Distill notes that were absorbed during this honing session.
			const distilledNoteIds: number[] = [];
			const warnings: ToolWarning[] = sharedGitWarning(ctx);
			for (const path of result.sealedPaths.filter((path) => directEdits.includes(path)))
				warnings.push(
					toolWarning('invalid_state', `${path}: direct edit detected, not via update`),
				);

			if (noteIds.length > 0) {
				if (!ctx.db) {
					warnings.push(
						toolWarning(
							'degraded_no_db',
							'note_ids provided but no database available — notes were not distilled.',
						),
					);
				} else {
					const primaryPath = result.sealedPaths[0] ?? input.paths?.[0] ?? '';
					for (const noteId of noteIds) {
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

			if (result.sealedPaths.length === 0) {
				const last = history(gitCtx).find((entry) => entry.hash === result.commitHash);
				return toolNoOp(
					last
						? `already sealed by ${['inscribe', 'hone', 'move', 'repair', 'delete', 'shelve', 'unshelve', 'rollback'].includes(last.message.split(' ')[0] ?? '') ? last.message.split(' ')[0] : 'hone'} ${last.hash.slice(0, 8)}`
						: 'nothing to seal',
					{
						commitHash: last?.hash ?? '',
						sealedPaths: [],
						ranks: {},
						tiers: {},
						distilledNoteIds,
					},
					{ warnings },
				);
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

			const deletedPaths = result.sealedPaths.filter(
				(path) => !existsSync(join(ctx.root, path, 'SKILL.md')),
			);
			const deletionSuffix = deletedPaths.length ? ` Deleted: ${deletedPaths.join(', ')}.` : '';
			const noteSuffix =
				distilledNoteIds.length > 0 ? ` Distilled ${distilledNoteIds.length} note(s).` : '';

			return toolSuccess(
				`Sealed ${result.sealedPaths.length} spell(s) in commit ${result.commitHash.slice(0, 8)}.${deletionSuffix}${noteSuffix}`,
				{
					spells: result.sealedPaths
						.filter((path) => existsSync(join(ctx.root, path, 'SKILL.md')))
						.map((path) => spellWriteData(ctx, path, input.verbose)),
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
