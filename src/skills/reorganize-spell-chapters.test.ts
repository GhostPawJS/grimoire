import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { manageSpellTool } from '../tools/manage_spell_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { reorganizeSpellChaptersSkill } from './reorganize-spell-chapters.ts';
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

const spellContent = (name: string, desc?: string) =>
	[
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

describe('reorganize-spell-chapters skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(reorganizeSpellChaptersSkill, [
			'review_grimoire',
			'manage_spell',
			'inspect_grimoire_item',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(reorganizeSpellChaptersSkill, DIRECT_API_NAMES);
	});

	it('has correct metadata', () => {
		strictEqual(reorganizeSpellChaptersSkill.name, 'reorganize-spell-chapters');
		ok(reorganizeSpellChaptersSkill.description.length > 0);
		ok(reorganizeSpellChaptersSkill.content.startsWith('# Reorganize Spell Chapters'));
	});

	it('simulates: review chapters → move spell → verify', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			await inscribeSpellTool.handler(ctx, {
				name: 'alpha-spell',
				content: spellContent('alpha-spell', 'First spell'),
				chapter: 'chapter-a',
			});
			await inscribeSpellTool.handler(ctx, {
				name: 'beta-spell',
				content: spellContent('beta-spell', 'Second spell'),
				chapter: 'chapter-a',
			});

			const reviewBefore = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'chapters' }),
			);
			const chaptersBefore = (reviewBefore.data as { chapters: Record<string, number> }).chapters;
			ok(chaptersBefore['chapter-a'] === 2);

			const moveResult = expectSuccess(
				await manageSpellTool.handler(ctx, {
					action: 'move',
					path: 'chapter-a/beta-spell',
					target: 'chapter-b/beta-spell',
				}),
			);
			ok(moveResult.summary.includes('beta-spell'));

			const reviewAfter = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'chapters' }),
			);
			const chaptersAfter = (reviewAfter.data as { chapters: Record<string, number> }).chapters;
			strictEqual(chaptersAfter['chapter-a'], 1);
			strictEqual(chaptersAfter['chapter-b'], 1);

			const inspectResult = expectSuccess(
				await inspectGrimoireItemTool.handler(ctx, { path: 'chapter-b/beta-spell' }),
			);
			strictEqual(inspectResult.data.spell.name, 'beta-spell');
		} finally {
			cleanup();
		}
	});

	it('simulates: shelve and unshelve during reorg', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			await inscribeSpellTool.handler(ctx, {
				name: 'stale-spell',
				content: spellContent('stale-spell', 'A spell to shelve'),
				chapter: 'general',
			});

			const reviewBefore = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'chapters' }),
			);
			strictEqual((reviewBefore.data as { totalSpells: number }).totalSpells, 1);

			const shelveResult = expectSuccess(
				await manageSpellTool.handler(ctx, {
					action: 'shelve',
					path: 'general/stale-spell',
				}),
			);
			ok(shelveResult.summary.includes('Shelved'));

			const reviewAfterShelve = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'chapters' }),
			);
			strictEqual((reviewAfterShelve.data as { totalSpells: number }).totalSpells, 0);

			const unshelveResult = expectSuccess(
				await manageSpellTool.handler(ctx, {
					action: 'unshelve',
					path: 'general/stale-spell',
				}),
			);
			ok(unshelveResult.summary.includes('Unshelved'));

			const reviewAfterUnshelve = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'chapters' }),
			);
			strictEqual((reviewAfterUnshelve.data as { totalSpells: number }).totalSpells, 1);
		} finally {
			cleanup();
		}
	});
});
