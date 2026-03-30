import { rollback } from '../git/rollback.ts';
import { deleteSpell } from '../spells/delete_spell.ts';
import { moveSpell } from '../spells/move_spell.ts';
import { repair } from '../spells/repair.ts';
import { repairAll } from '../spells/repair_all.ts';
import { shelve } from '../spells/shelve.ts';
import { unshelve } from '../spells/unshelve.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, enumSchema, objectSchema, stringSchema } from './tool_metadata.ts';
import { manageSpellToolName } from './tool_names.ts';
import { inspectSpellNext, reviewViewNext, searchNext } from './tool_next.ts';
import { toSpellPathRef } from './tool_ref.ts';
import { summarizeSpellAction } from './tool_summary.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

type ManageInput =
	| { action: 'shelve'; path: string }
	| { action: 'unshelve'; path: string }
	| { action: 'move'; path: string; target: string }
	| { action: 'delete'; path: string }
	| { action: 'repair'; path: string }
	| { action: 'repair_all' }
	| { action: 'rollback'; path: string; ref: string };

export const manageSpellTool = defineGrimoireTool<ManageInput, ToolResult<Record<string, unknown>>>(
	{
		name: manageSpellToolName,
		description:
			'Manage spells: shelve, unshelve, move, delete, repair, repair all, or rollback to a previous seal.',
		whenToUse:
			'When you need to reorganize, archive, restore, move, remove, fix, or revert spells.',
		whenNotToUse:
			'When creating new spells — use inscribe_spell. When sealing changes — use hone_spell.',
		sideEffects: 'writes_state',
		readOnly: false,
		supportsClarification: false,
		targetKinds: ['spell'],
		inputDescriptions: {
			action:
				'The management action: shelve, unshelve, move, delete, repair, repair_all, or rollback.',
			path: 'Spell path (required for all actions except repair_all).',
			target: 'Target path for move action.',
			ref: 'Git commit hash to rollback to (rollback only). Use inspect_grimoire_item to find seal hashes from history.',
		},
		outputDescription: 'Action-specific result with the affected spell path(s).',
		inputSchema: objectSchema(
			{
				action: enumSchema(
					'The management action to perform: shelve, unshelve, move, delete, repair, repair_all, or rollback.',
					['shelve', 'unshelve', 'move', 'delete', 'repair', 'repair_all', 'rollback'],
				),
				path: stringSchema('Spell path — required for all actions except repair_all.'),
				target: stringSchema('Target path — required for move.'),
				ref: stringSchema(
					'Git commit hash to revert to — required for rollback. Use inspect_grimoire_item to find seal hashes from history.',
				),
			},
			['action'],
			'Manage a spell. Use action to select the operation.',
		),
		handler(ctx, input) {
			try {
				switch (input.action) {
					case 'shelve': {
						const result = shelve(ctx.root, input.path, ctx.db);
						return toolSuccess(
							summarizeSpellAction('Shelved', input.path),
							{ action: 'shelve', shelvedPath: result.path },
							{
								entities: [toSpellPathRef(result.path)],
								next: [reviewViewNext('chapters')],
							},
						);
					}
					case 'unshelve': {
						const result = unshelve(ctx.root, input.path, ctx.db);
						return toolSuccess(
							summarizeSpellAction('Unshelved', input.path),
							{ action: 'unshelve', restoredPath: result.path },
							{
								entities: [toSpellPathRef(result.path)],
								next: [inspectSpellNext(result.path)],
							},
						);
					}
					case 'move': {
						const result = moveSpell(ctx.root, input.path, input.target, ctx.db);
						return toolSuccess(
							summarizeSpellAction('Moved', input.path),
							{ action: 'move', from: result.from, to: result.to },
							{
								entities: [toSpellPathRef(result.to)],
								next: [inspectSpellNext(result.to)],
							},
						);
					}
					case 'delete': {
						deleteSpell(ctx.root, input.path, ctx.db);
						return toolSuccess(
							summarizeSpellAction('Deleted', input.path),
							{ action: 'delete', path: input.path },
							{
								next: [searchNext(input.path, 'Search for remaining spells.')],
							},
						);
					}
					case 'repair': {
						const result = repair(ctx.root, input.path);
						return toolSuccess(
							result.fixes.length > 0
								? `Repaired spell \`${input.path}\` with ${result.fixes.length} fix(es).`
								: `Spell \`${input.path}\` needs no repairs.`,
							{ action: 'repair', ...result },
							{
								entities: [toSpellPathRef(input.path)],
								next: [inspectSpellNext(input.path)],
							},
						);
					}
					case 'repair_all': {
						const results = repairAll(ctx.root);
						const fixed = results.filter((r) => r.fixes.length > 0);
						return toolSuccess(
							fixed.length > 0
								? `Repaired ${fixed.length} spell(s).`
								: 'All spells are healthy — no repairs needed.',
							{ action: 'repair_all', results },
							{
								entities: fixed.map((r) => toSpellPathRef(r.path)),
								next: [reviewViewNext('validation')],
							},
						);
					}
					case 'rollback': {
						const gitCtx = { root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) };
						const result = rollback(gitCtx, input.path, input.ref);
						if (!result.success) {
							return translateToolError(
								new Error(
									`Rollback failed for \`${input.path}\` to ref ${input.ref}. Verify the ref exists in seal history.`,
								),
							);
						}
						return toolSuccess(
							`Rolled back spell \`${input.path}\` to seal ${input.ref.slice(0, 8)}.`,
							{ action: 'rollback', path: input.path, restoredRef: result.restoredRef },
							{
								entities: [toSpellPathRef(input.path)],
								next: [inspectSpellNext(input.path)],
							},
						);
					}
				}
			} catch (error) {
				return translateToolError(error);
			}
		},
	},
);
