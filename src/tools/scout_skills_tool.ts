import { searchSkills } from '../registry/search_skills.ts';
import { applyUpdate } from '../scouting/apply_update.ts';
import { checkUpdates } from '../scouting/check_updates.ts';
import { scout } from '../scouting/scout.ts';
import { translateToolError } from './tool_errors.ts';
import type { GrimoireToolContext } from './tool_metadata.ts';
import {
	defineGrimoireTool,
	literalSchema,
	objectSchema,
	oneOfSchema,
	stringSchema,
} from './tool_metadata.ts';
import { scoutSkillsToolName } from './tool_names.ts';
import { inspectSpellNext, useToolNext } from './tool_next.ts';
import { toSpellPathRef, toSpellRef } from './tool_ref.ts';
import { summarizeCount } from './tool_summary.ts';
import type { ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess, toolWarning } from './tool_types.ts';

type ScoutInput =
	| { action: 'adopt'; source: string; chapter?: string }
	| { action: 'search'; query: string }
	| { action: 'check_updates' }
	| { action: 'apply_update'; path: string };

export const scoutSkillsTool = defineGrimoireTool<ScoutInput, ToolResult<Record<string, unknown>>>({
	name: scoutSkillsToolName,
	description: 'Scout, search, adopt, and update spells from external sources.',
	whenToUse:
		'When discovering new skills from AgentSkillHub or GitHub, importing them, or checking for upstream updates.',
	whenNotToUse: 'When working with local spells only — use inscribe_spell or hone_spell.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell', 'provenance'],
	inputDescriptions: {
		action:
			'Scout action: adopt (import from source), search (find skills), check_updates, or apply_update.',
		source: 'Source URL or identifier (adopt only).',
		chapter: 'Optional chapter for adopted spells (adopt only).',
		query: 'Search query (search only).',
		path: 'Spell path to update (apply_update only).',
	},
	outputDescription:
		'Action-specific result: adopted spells, search results, update checks, or apply result.',
	inputSchema: oneOfSchema(
		[
			objectSchema(
				{
					action: literalSchema('adopt'),
					source: stringSchema('Source URL or identifier'),
					chapter: stringSchema('Chapter for adopted spells'),
				},
				['action', 'source'],
			),
			objectSchema(
				{
					action: literalSchema('search'),
					query: stringSchema('Search query'),
				},
				['action', 'query'],
			),
			objectSchema(
				{
					action: literalSchema('check_updates'),
				},
				['action'],
			),
			objectSchema(
				{
					action: literalSchema('apply_update'),
					path: stringSchema('Spell path'),
				},
				['action', 'path'],
			),
		],
		'Scout action.',
	),
	async handler(ctx: GrimoireToolContext, input: ScoutInput) {
		try {
			switch (input.action) {
				case 'adopt': {
					if (!ctx.db) {
						return toolFailure(
							'system',
							'system_error',
							'Cannot adopt spells without a database.',
							'No database connection available.',
						);
					}
					const result = await scout(
						ctx.root,
						ctx.db,
						input.source,
						input.chapter ? { chapter: input.chapter } : undefined,
					);
					const entities = result.imported.map((r) => toSpellRef(r.spell));
					const next = result.imported
						.slice(0, 3)
						.map((r) => inspectSpellNext(r.spell.path, r.spell.name));
					const warnings = result.errors.map((e) =>
						toolWarning('empty_result', `Failed to adopt "${e.path}": ${e.error}`),
					);
					return toolSuccess(
						`Adopted ${result.imported.length} spell(s), skipped ${result.skipped.length}.`,
						{
							imported: result.imported,
							skipped: result.skipped,
							errors: result.errors,
						},
						{ entities, next, warnings },
					);
				}
				case 'search': {
					const results = await searchSkills(input.query);
					return toolSuccess(
						summarizeCount(results.length, 'skill'),
						{ results },
						{
							next: results.slice(0, 3).map((r) =>
								useToolNext(scoutSkillsToolName, `Adopt "${r.name}" from ${r.sourceRepo}.`, {
									action: 'adopt',
									source: r.fetchUrl,
								}),
							),
							...(results.length === 0
								? {
										warnings: [
											toolWarning('empty_result', `No skills found for "${input.query}".`),
										],
									}
								: {}),
						},
					);
				}
				case 'check_updates': {
					if (!ctx.db) {
						return toolFailure(
							'system',
							'system_error',
							'Cannot check updates without a database.',
							'No database connection available.',
						);
					}
					const checks = await checkUpdates(ctx.root, ctx.db);
					const entities = checks.map((c) => toSpellPathRef(c.spellPath));
					const next = checks.map((c) =>
						useToolNext(scoutSkillsToolName, `Apply update for "${c.spellPath}".`, {
							action: 'apply_update',
							path: c.spellPath,
						}),
					);
					return toolSuccess(
						summarizeCount(checks.length, 'update available', 'updates available'),
						{ checks },
						{ entities, ...(next.length > 0 ? { next } : {}) },
					);
				}
				case 'apply_update': {
					if (!ctx.db) {
						return toolFailure(
							'system',
							'system_error',
							'Cannot apply updates without a database.',
							'No database connection available.',
						);
					}
					const result = await applyUpdate(ctx.root, ctx.db, input.path);
					if ('applied' in result && result.applied) {
						return toolSuccess(
							`Applied update to \`${input.path}\`, new rank: ${result.newRank}.`,
							{ applied: true, path: input.path, newRank: result.newRank },
							{
								entities: [toSpellPathRef(input.path)],
								next: [inspectSpellNext(input.path)],
							},
						);
					}
					return toolSuccess(
						`Update for \`${input.path}\` requires manual reconciliation.`,
						{
							applied: false,
							path: input.path,
							reconciliation: (result as { reconciliation: unknown }).reconciliation,
						},
						{
							entities: [toSpellPathRef(input.path)],
						},
					);
				}
			}
		} catch (error) {
			return translateToolError(error);
		}
	},
});
