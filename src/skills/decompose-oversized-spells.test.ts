import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { manageSpellTool } from '../tools/manage_spell_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { decomposeOversizedSpellsSkill } from './decompose-oversized-spells.ts';
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

describe('decompose-oversized-spells skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(decomposeOversizedSpellsSkill, [
			'inspect_grimoire_item',
			'inscribe_spell',
			'manage_spell',
			'hone_spell',
			'review_grimoire',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(decomposeOversizedSpellsSkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect oversized → inscribe parts → shelve original', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const largeBody = Array.from({ length: 50 }, (_, i) => `Section ${i + 1} content.`).join(
				'\n\n',
			);
			const largeContent = [
				'---',
				'name: big-spell',
				'description: An oversized spell covering many topics',
				'---',
				'',
				'# big-spell',
				'',
				largeBody,
				'',
			].join('\n');

			const inscribed = expectSuccess(
				await inscribeSpellTool.handler(ctx, { name: 'big-spell', content: largeContent }),
			);
			const originalPath = (inscribed.data as { spell: { path: string } }).spell.path;

			const inspected = expectSuccess(
				await inspectGrimoireItemTool.handler(ctx, { path: originalPath }),
			);
			ok(inspected.data, 'inspect should return data for the oversized spell');

			expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'big-spell-part-a',
					content: spellContent('big-spell-part-a', 'First focused module from big-spell'),
				}),
			);
			expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'big-spell-part-b',
					content: spellContent('big-spell-part-b', 'Second focused module from big-spell'),
				}),
			);

			expectSuccess(await manageSpellTool.handler(ctx, { action: 'shelve', path: originalPath }));

			const chapters = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'chapters' }));
			const chaptersData = chapters.data as { totalSpells: number };
			strictEqual(chaptersData.totalSpells, 2, 'should have 2 new spells after shelving original');
		} finally {
			cleanup();
		}
	});

	it('simulates: verify split spells pass validation', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'focused-spell',
					content: spellContent('focused-spell', 'A well-formed focused spell'),
				}),
			);

			const validation = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'validation' }),
			);
			const validationData = validation.data as { invalidCount: number };
			strictEqual(validationData.invalidCount, 0, 'focused spell should pass validation');
		} finally {
			cleanup();
		}
	});
});
