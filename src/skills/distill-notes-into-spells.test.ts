import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dropNoteTool } from '../tools/drop_note_tool.ts';
import { manageDraftTool } from '../tools/manage_draft_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { runCatalogueTool } from '../tools/run_catalogue_tool.ts';
import { distillNotesIntoSpellsSkill } from './distill-notes-into-spells.ts';
import {
	createSkillTestCtx,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

const DIRECT_API_NAMES = [
	'buildIndex',
	'formatIndex',
	'listChapters',
	'listSpells',
	'getSpell',
	'getContent',
	'renderContent',
	'readCatalogue',
	'allResonance',
	'resonance',
	'eventsSince',
	'allRanks',
	'rank',
	'tier',
	'tierInfo',
	'diff',
	'history',
	'pendingChanges',
	'isGitAvailable',
	'validate',
	'validateAll',
	'checkTierRequirements',
	'pendingNotes',
	'pendingNoteCount',
	'noteCounts',
	'listNotes',
	'pendingDrafts',
	'getProvenance',
	'allProvenance',
	'searchIndex',
	'parseSkillMd',
	'serializeSkillMd',
	'validateSkillMd',
	'countBodyLines',
	'inscribe',
	'deleteSpell',
	'shelve',
	'unshelve',
	'moveSpell',
	'seal',
	'rollback',
	'repair',
	'repairAll',
	'logEvent',
	'dropNote',
	'dropNotes',
	'distill',
	'enforceNoteCap',
	'expireNotes',
	'catalogue',
	'submitDraft',
	'approveDraft',
	'dismissDraft',
	'adoptSpell',
	'adoptSpells',
	'scout',
	'fetchSkills',
	'checkUpdates',
	'applyUpdate',
	'searchSkills',
	'analyzeRepo',
	'refreshIndex',
];

describe('distill-notes-into-spells skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(distillNotesIntoSpellsSkill, [
			'review_grimoire',
			'run_catalogue',
			'manage_draft',
			'inscribe_spell',
			'drop_note',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(distillNotesIntoSpellsSkill, DIRECT_API_NAMES);
	});

	it('simulates: drop notes → review → catalogue', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Insight about testing', source: 'user' }),
			);
			expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Pattern in error handling', source: 'user' }),
			);
			expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Observation on caching', source: 'agent' }),
			);

			const notesResult = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'notes' }));
			ok(notesResult.ok);
			ok(((notesResult.data as Record<string, unknown>).pendingCount as number) >= 3);

			const catResult = expectSuccess(await runCatalogueTool.handler(ctx, {}));
			ok(catResult.ok);
		} finally {
			cleanup();
		}
	});

	it('simulates: submit and approve a draft', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const note1 = expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Draft evidence one', source: 'test' }),
			);
			const note2 = expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Draft evidence two', source: 'test' }),
			);

			const submitResult = expectSuccess(
				await manageDraftTool.handler(ctx, {
					action: 'submit',
					title: 'New Testing Spell',
					rationale: 'Multiple notes suggest a testing pattern worth capturing.',
					noteIds: [note1.data.noteId, note2.data.noteId],
					chapter: 'general',
				}),
			);
			ok(submitResult.ok);
			const draftId = (submitResult.data as Record<string, unknown>).draftId as number;
			ok(typeof draftId === 'number');

			const approveResult = expectSuccess(
				await manageDraftTool.handler(ctx, { action: 'approve', draftId }),
			);
			ok(approveResult.ok);
			strictEqual((approveResult.data as Record<string, unknown>).draftId, draftId);
		} finally {
			cleanup();
		}
	});
});
