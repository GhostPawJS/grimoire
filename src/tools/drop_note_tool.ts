import { dropNote } from '../notes/drop_note.ts';
import { pendingNoteCount } from '../notes/pending_note_count.ts';
import { translateToolError } from './tool_errors.ts';
import { defineGrimoireTool, objectSchema, stringSchema } from './tool_metadata.ts';
import { dropNoteToolName } from './tool_names.ts';
import { catalogueNext, reviewViewNext } from './tool_next.ts';
import type { ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

type DropNoteInput = { content: string; source: string; domain?: string };
type DropNoteData = { noteId: number };

export const dropNoteTool = defineGrimoireTool<DropNoteInput, ToolResult<DropNoteData>>({
	name: dropNoteToolName,
	description: 'Drop an observation note into the grimoire for later cataloguing.',
	whenToUse: 'When capturing an insight, observation, or piece of evidence about a spell topic.',
	whenNotToUse: 'When creating or editing a spell directly — use inscribe_spell or hone_spell.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['note'],
	inputDescriptions: {
		content: 'The note content — an observation, insight, or evidence snippet.',
		source: 'Who or what produced this note (e.g. "user", "agent", tool name).',
		domain: 'Optional topic domain to aid routing (e.g. "typescript", "testing").',
	},
	outputDescription: 'The ID of the newly created note.',
	inputSchema: objectSchema(
		{
			content: stringSchema('Note content'),
			source: stringSchema('Source identifier'),
			domain: stringSchema('Topic domain'),
		},
		['content', 'source'],
	),
	handler(ctx, input) {
		if (!ctx.db) {
			return toolFailure(
				'system',
				'system_error',
				'Cannot drop notes without a database.',
				'No database connection available.',
				{ recovery: 'Initialize grimoire with a database to use note features.' },
			);
		}
		try {
			const result = dropNote(ctx.db, {
				content: input.content,
				source: input.source,
				...(input.domain ? { domain: input.domain } : {}),
			});
			const count = pendingNoteCount(ctx.db);
			const next: ToolNextStepHint[] = [reviewViewNext('notes')];
			if (count >= 10) {
				next.unshift(catalogueNext());
			}
			return toolSuccess(`Dropped note #${result.id}.`, { noteId: result.id }, { next });
		} catch (error) {
			return translateToolError(error);
		}
	},
});
