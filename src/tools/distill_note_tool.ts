import { distill } from '../notes/distill.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, integerSchema, objectSchema, stringSchema } from './tool_metadata.ts';
import { distillNoteToolName } from './tool_names.ts';
import { inspectSpellNext, reviewViewNext } from './tool_next.ts';
import type { ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

type DistillNoteInput = { note_id: number; spell_path: string };
type DistillNoteData = { noteId: number; spellPath: string };

export const distillNoteTool = defineGrimoireTool<DistillNoteInput, ToolResult<DistillNoteData>>({
	name: distillNoteToolName,
	description: 'Mark a pending note as distilled into a spell after incorporating its evidence.',
	whenToUse:
		"After updating a spell body to incorporate a note's evidence and sealing with hone_spell. Closes the note so it no longer counts as pending evidence.",
	whenNotToUse:
		"Before editing the spell — distill only after the note's content has been genuinely incorporated.",
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['note'],
	inputDescriptions: {
		note_id:
			'The numeric ID of the note to distill (from drop_note or review_grimoire notes view).',
		spell_path: 'The spell path the note was incorporated into (e.g. "chapter/spell-name").',
	},
	outputDescription:
		'Confirms the note is marked distilled and linked to the spell. The note will no longer appear in pending evidence counts.',
	inputSchema: objectSchema(
		{
			note_id: integerSchema('Note ID'),
			spell_path: stringSchema('Spell path the note was incorporated into'),
		},
		['note_id', 'spell_path'],
	),
	handler(ctx, input) {
		if (!ctx.db) {
			return toolFailure(
				'system',
				'system_error',
				'Cannot distill notes without a database.',
				'No database connection available.',
				{ recovery: 'Initialize grimoire with a database to use note features.' },
			);
		}
		try {
			distill(ctx.db, input.note_id, input.spell_path);
			return toolSuccess(
				`Distilled note #${input.note_id} into \`${input.spell_path}\`.`,
				{ noteId: input.note_id, spellPath: input.spell_path },
				{
					next: [
						inspectSpellNext(input.spell_path),
						reviewViewNext('notes', 'Check remaining pending notes.'),
					],
				},
			);
		} catch (error) {
			return translateToolError(error);
		}
	},
});
