import { updateSpell } from '../spells/update_spell.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { honeSpellToolName, updateSpellToolName } from './tool_names.ts';
import { inspectSpellNext, useToolNext } from './tool_next.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

type UpdateSpellInput = { path: string; content: string };
type UpdateSpellData = { path: string };

export const updateSpellTool = defineGrimoireTool<UpdateSpellInput, ToolResult<UpdateSpellData>>({
	name: updateSpellToolName,
	description: 'Write new content to an existing spell, leaving the change uncommitted.',
	whenToUse:
		'When incorporating note evidence or improvements into an existing spell body. Follow with hone_spell to seal and advance rank.',
	whenNotToUse:
		'When creating a brand-new spell — use inscribe_spell instead. When you only want to checkpoint existing edits — use hone_spell directly.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['spell'],
	inputDescriptions: {
		path: 'The spell path to update (e.g. "chapter/spell-name").',
		content:
			'The full new SKILL.md content, spec-compliant (YAML frontmatter + markdown body). Inspect the spell first to read its current content.',
	},
	outputDescription:
		'Confirms the spell was updated on disk. The change is uncommitted — call hone_spell to seal it.',
	inputSchema: objectSchema(
		{
			path: stringSchema('Spell path'),
			content: stringSchema('Full spec-compliant SKILL.md content'),
		},
		['path', 'content'],
	),
	handler(ctx, input) {
		try {
			updateSpell(ctx.root, input.path, input.content);
			return toolSuccess(
				`Updated spell \`${input.path}\`. Call hone_spell to seal and advance rank.`,
				{ path: input.path },
				{
					next: [
						useToolNext(honeSpellToolName, 'Seal the update to advance spell rank.', {
							paths: [input.path],
						}),
						inspectSpellNext(input.path),
					],
				},
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
