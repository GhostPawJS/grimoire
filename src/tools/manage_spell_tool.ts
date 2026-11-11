import { GrimoireNotFoundError } from '../errors.ts';
import { history } from '../git/history.ts';
import { rollback } from '../git/rollback.ts';
import { deleteSpell } from '../spells/delete_spell.ts';
import { moveSpell } from '../spells/move_spell.ts';
import { repair } from '../spells/repair.ts';
import { repairAll } from '../spells/repair_all.ts';
import { shelve } from '../spells/shelve.ts';
import { unshelve } from '../spells/unshelve.ts';
import { spellWriteData } from './spell_write_data.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, enumSchema, objectSchema, stringSchema } from './tool_metadata.ts';
import { manageSpellToolName } from './tool_names.ts';
import { inspectSpellNext, reviewViewNext, searchNext } from './tool_next.ts';
import { toSpellPathRef } from './tool_ref.ts';
import { summarizeSpellAction } from './tool_summary.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

type ManageInput = (
	| { action: 'shelve'; path: string }
	| { action: 'unshelve'; path: string; force?: boolean }
	| { action: 'move'; path: string; target: string; force?: boolean }
	| { action: 'delete'; path: string }
	| { action: 'repair'; path: string }
	| { action: 'repair_all' }
	| { action: 'rollback'; path: string; ref: string }
) & { verbose?: boolean };

export const manageSpellTool = defineGrimoireTool<ManageInput, ToolResult<Record<string, unknown>>>(
	{
		name: manageSpellToolName,
		description: 'Archive, restore, move, delete, repair, or roll back spells.',
		whenToUse: 'Manage spell files and history.',
		whenNotToUse: 'Create with inscribe_spell; seal with hone_spell.',
		sideEffects: 'writes_state',
		readOnly: false,
		supportsClarification: false,
		targetKinds: ['spell'],
		inputDescriptions: {
			force: 'Overwrite the target spell.',
			action: 'Management action.',
			path: 'Required except repair_all.',
			target: 'Target path for move action.',
			ref: 'Rollback hash from inspect_grimoire_item history.',
		},
		outputDescription: 'Action result and affected paths.',
		inputSchema: objectSchema(
			{
				action: enumSchema('Management action.', [
					'shelve',
					'unshelve',
					'move',
					'delete',
					'repair',
					'repair_all',
					'rollback',
				]),
				verbose: { type: 'boolean', description: 'Include full spell if available.' },
				force: {
					type: 'boolean',
					description: 'Overwrite the target spell.',
				},
				path: stringSchema('Required except repair_all.'),
				target: stringSchema('Required move target.'),
				ref: stringSchema('Required rollback hash; find via inspect_grimoire_item.'),
			},
			['action'],
			'Manage a spell. Use action to select the operation.',
		),
		handler(ctx, input) {
			try {
				let before: ReturnType<typeof spellWriteData> | undefined;
				if ('path' in input) {
					try {
						before = spellWriteData(ctx, input.path, input.verbose);
					} catch {
						/* Repair and unshelve can start without a readable live spell. */
					}
				}
				const success = (
					summary: string,
					data: Record<string, unknown>,
					options: Parameters<typeof toolSuccess>[2],
				) => {
					const path = String(
						data.to ?? data.restoredPath ?? data.path ?? ('path' in input ? input.path : ''),
					);
					let metadata = before;
					try {
						metadata = spellWriteData(ctx, path, input.verbose);
					} catch {
						/* Deleted and shelved spells use their pre-operation metadata. */
					}
					const commit =
						history(
							{ root: ctx.root, ...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}) },
							path || undefined,
						)[0]?.hash.slice(0, 8) ?? '';
					return toolSuccess(summary, { ...metadata, ...data, commit }, options);
				};
				const inspected = (path: string) => ({
					entities: [toSpellPathRef(path)],
					next: [inspectSpellNext(path)],
				});
				switch (input.action) {
					case 'shelve': {
						const result = shelve(
							ctx.root,
							input.path,
							ctx.db,
							ctx.gitDir ? { gitDir: ctx.gitDir } : undefined,
						);
						return success(
							summarizeSpellAction('Shelved', input.path),
							{ action: 'shelve', shelvedPath: result.path },
							{
								entities: [toSpellPathRef(result.path)],
								next: [reviewViewNext('chapters')],
							},
						);
					}
					case 'unshelve': {
						const result = unshelve(ctx.root, input.path, ctx.db, {
							...(input.force !== undefined ? { force: input.force } : {}),
							...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}),
						});
						return success(
							summarizeSpellAction('Unshelved', input.path),
							{ action: 'unshelve', restoredPath: result.path },
							inspected(result.path),
						);
					}
					case 'move': {
						const result = moveSpell(ctx.root, input.path, input.target, ctx.db, {
							...(input.force !== undefined ? { force: input.force } : {}),
							...(ctx.gitDir ? { gitDir: ctx.gitDir } : {}),
						});
						return success(
							summarizeSpellAction('Moved', input.path),
							{ action: 'move', from: result.from, to: result.to },
							inspected(result.to),
						);
					}
					case 'delete': {
						deleteSpell(
							ctx.root,
							input.path,
							ctx.db,
							ctx.gitDir ? { gitDir: ctx.gitDir } : undefined,
						);
						return success(
							summarizeSpellAction('Deleted', input.path),
							{ action: 'delete', path: input.path },
							{
								next: [searchNext(input.path, 'Search for remaining spells.')],
							},
						);
					}
					case 'repair': {
						const result = repair(
							ctx.root,
							input.path,
							ctx.gitDir ? { gitDir: ctx.gitDir } : undefined,
						);
						return success(
							result.fixes.length > 0
								? `Repaired spell \`${input.path}\` with ${result.fixes.length} fix(es).`
								: `Spell \`${input.path}\` needs no repairs.`,
							{ action: 'repair', ...result },
							inspected(input.path),
						);
					}
					case 'repair_all': {
						const results = repairAll(ctx.root, ctx.gitDir ? { gitDir: ctx.gitDir } : undefined);
						const fixed = results.filter((r) => r.fixes.length > 0);
						return success(
							fixed.length > 0
								? `Repaired ${fixed.length} spell(s).`
								: 'All spells are healthy — no repairs needed.',
							{
								action: 'repair_all',
								results,
								spells: results.map((result) => {
									try {
										return spellWriteData(ctx, result.path, input.verbose);
									} catch {
										return { path: result.path };
									}
								}),
							},
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
								new GrimoireNotFoundError(
									`Rollback failed for \`${input.path}\` to ref ${input.ref}. Use inspect_grimoire_item or inspect <path> to find a hash in seal history.`,
								),
							);
						}
						return success(
							`Rolled back spell \`${input.path}\` to seal ${input.ref.slice(0, 8)}.`,
							{ action: 'rollback', path: input.path, restoredRef: result.restoredRef },
							inspected(input.path),
						);
					}
				}
			} catch (error) {
				return translateToolError(error);
			}
		},
	},
);
