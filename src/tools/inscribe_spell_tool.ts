import { inscribe } from '../spells/inscribe.ts';
import type { DuplicationWarning, Spell } from '../spells/types.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { inscribeSpellToolName } from './tool_names.ts';
import { inspectSpellNext, searchNext } from './tool_next.ts';
import { toSpellRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

type InscribeToolInput = { name: string; content: string; chapter?: string; force?: boolean };
type InscribeToolData = { spell: Spell; warnings: DuplicationWarning[] };

export const inscribeSpellTool = defineGrimoireTool<
	InscribeToolInput,
	ToolResult<InscribeToolData>
>({
	name: inscribeSpellToolName,
	description: 'Create a new spell in the grimoire.',
	whenToUse: 'When writing a new skill/spell into the grimoire from scratch.',
	whenNotToUse:
		'When updating existing spell content — use update_spell to edit, then hone_spell to seal.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		name: 'Name of the spell (used as directory name, kebab-cased).',
		content: 'Full markdown body content for the spell.',
		chapter: 'Optional chapter to place the spell in (defaults to "general").',
	},
	outputDescription:
		'The newly created spell object and any duplication warnings for similar existing spells.',
	inputSchema: objectSchema(
		{
			name: { ...stringSchema('Spell name'), pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 64 },
			content: stringSchema('Spell body content in markdown'),
			chapter: {
				...stringSchema('Chapter name'),
				pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
				maxLength: 64,
			},
			force: {
				type: 'boolean',
				description: 'Replace an existing spell at the same path. Default false.',
			},
		},
		['name', 'content'],
	),
	handler(ctx, input) {
		try {
			const result = inscribe(ctx.root, ctx.db, {
				...(input.force !== undefined ? { force: input.force } : {}),
				name: input.name,
				content: input.content,
				...(input.chapter !== undefined ? { chapter: input.chapter } : {}),
			});
			const entities = [toSpellRef(result.spell)];
			const next = [inspectSpellNext(result.spell.path, result.spell.name)];
			const warnings = result.warnings.map((w) =>
				toolWarning(
					'duplication_detected',
					`Similar spell exists at "${w.existingPath}" (${Math.round(w.similarity * 100)}% similar).`,
				),
			);
			if (warnings.length > 0) {
				next.push(searchNext(input.name, 'Search for potentially duplicate spells.'));
			}
			return toolSuccess(
				`Inscribed spell \`${result.spell.path}\`.`,
				{ spell: result.spell, warnings: result.warnings },
				{ entities, next, warnings },
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
