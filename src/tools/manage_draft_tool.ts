import { approveDraft } from '../drafts/approve_draft.ts';
import { dismissDraft } from '../drafts/dismiss_draft.ts';
import { submitDraft } from '../drafts/submit_draft.ts';
import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	defineGrimoireTool,
	integerSchema,
	literalSchema,
	objectSchema,
	oneOfSchema,
	stringSchema,
} from './tool_metadata.ts';
import { inscribeSpellToolName, manageDraftToolName } from './tool_names.ts';
import { reviewViewNext, useToolNext } from './tool_next.ts';
import type { ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

type ManageDraftInput =
	| { action: 'submit'; title: string; rationale: string; noteIds: number[]; chapter: string }
	| { action: 'approve'; draftId: number }
	| { action: 'dismiss'; draftId: number };

export const manageDraftTool = defineGrimoireTool<
	ManageDraftInput,
	ToolResult<Record<string, unknown>>
>({
	name: manageDraftToolName,
	description: 'Submit, approve, or dismiss spell drafts.',
	whenToUse:
		'When managing the draft pipeline — proposing new spells from notes, approving, or dismissing drafts.',
	whenNotToUse: 'When creating spells directly — use inscribe_spell instead.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['draft'],
	inputDescriptions: {
		action: 'Draft action: submit, approve, or dismiss.',
		title: 'Draft title (submit only).',
		rationale: 'Why this draft should become a spell (submit only).',
		noteIds: 'IDs of notes backing this draft (submit only).',
		chapter: 'Chapter for the potential spell (submit only).',
		draftId: 'ID of the draft (approve/dismiss only).',
	},
	outputDescription: 'The result of the draft action.',
	inputSchema: oneOfSchema(
		[
			objectSchema(
				{
					action: literalSchema('submit'),
					title: stringSchema('Draft title'),
					rationale: stringSchema('Rationale'),
					noteIds: arraySchema(integerSchema('Note ID'), 'Note IDs'),
					chapter: stringSchema('Chapter'),
				},
				['action', 'title', 'rationale', 'noteIds', 'chapter'],
			),
			objectSchema(
				{
					action: literalSchema('approve'),
					draftId: integerSchema('Draft ID'),
				},
				['action', 'draftId'],
			),
			objectSchema(
				{
					action: literalSchema('dismiss'),
					draftId: integerSchema('Draft ID'),
				},
				['action', 'draftId'],
			),
		],
		'Draft management action.',
	),
	handler(ctx, input) {
		if (!ctx.db) {
			return toolFailure(
				'system',
				'system_error',
				'Cannot manage drafts without a database.',
				'No database connection available.',
				{ recovery: 'Initialize grimoire with a database to use draft features.' },
			);
		}
		try {
			switch (input.action) {
				case 'submit': {
					const result = submitDraft(ctx.db, {
						title: input.title,
						rationale: input.rationale,
						noteIds: input.noteIds,
						chapter: input.chapter,
					});
					return toolSuccess(
						`Submitted draft #${result.id} "${input.title}".`,
						{ action: 'submit', draftId: result.id },
						{ next: [reviewViewNext('drafts')] },
					);
				}
				case 'approve': {
					approveDraft(ctx.db, input.draftId);
					return toolSuccess(
						`Approved draft #${input.draftId}.`,
						{ action: 'approve', draftId: input.draftId },
						{
							next: [
								useToolNext(inscribeSpellToolName, 'Inscribe the approved draft as a new spell.'),
							],
						},
					);
				}
				case 'dismiss': {
					dismissDraft(ctx.db, input.draftId);
					return toolSuccess(
						`Dismissed draft #${input.draftId}.`,
						{ action: 'dismiss', draftId: input.draftId },
						{ next: [reviewViewNext('notes')] },
					);
				}
			}
		} catch (error) {
			return translateToolError(error);
		}
	},
});
