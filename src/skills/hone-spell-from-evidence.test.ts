import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dropNoteTool } from '../tools/drop_note_tool.ts';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { runCatalogueTool } from '../tools/run_catalogue_tool.ts';
import { honeSpellFromEvidenceSkill } from './hone-spell-from-evidence.ts';
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

function spellContent(name: string, desc?: string): string {
	return [
		'---',
		`name: ${name}`,
		`description: ${desc ?? `A test spell named ${name}`}`,
		'---',
		'',
		`# ${name}`,
		'',
		'Body content here.',
		'',
	].join('\n');
}

describe('hone-spell-from-evidence skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(honeSpellFromEvidenceSkill, [
			'inspect_grimoire_item',
			'review_grimoire',
			'hone_spell',
			'drop_note',
			'run_catalogue',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(honeSpellFromEvidenceSkill, DIRECT_API_NAMES);
	});

	it('simulates: drop notes → inscribe spell → review notes', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const inscribeResult = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'test-spell',
					content: spellContent('test-spell'),
				}),
			);
			ok(inscribeResult.ok);

			expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Observation one', source: 'test' }),
			);
			expectSuccess(
				await dropNoteTool.handler(ctx, { content: 'Observation two', source: 'test' }),
			);
			expectSuccess(await dropNoteTool.handler(ctx, { content: 'Evidence three', source: 'test' }));

			const notesResult = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'notes' }));
			ok(notesResult.ok);
			ok(((notesResult.data as Record<string, unknown>).pendingCount as number) >= 3);
		} finally {
			cleanup();
		}
	});

	it('simulates: run catalogue processes notes', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			expectSuccess(await dropNoteTool.handler(ctx, { content: 'Note alpha', source: 'test' }));
			expectSuccess(await dropNoteTool.handler(ctx, { content: 'Note beta', source: 'test' }));

			const catResult = expectSuccess(await runCatalogueTool.handler(ctx, {}));
			ok(catResult.ok);
		} finally {
			cleanup();
		}
	});
});
