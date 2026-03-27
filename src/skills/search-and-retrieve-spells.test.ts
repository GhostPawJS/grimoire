import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { searchGrimoireTool } from '../tools/search_grimoire_tool.ts';
import { searchAndRetrieveSpellsSkill } from './search-and-retrieve-spells.ts';
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

const spellContent = (name: string, desc: string) =>
	[
		'---',
		`name: ${name}`,
		`description: ${desc}`,
		'---',
		'',
		`# ${name}`,
		'',
		'Body content here.',
		'',
	].join('\n');

describe('search-and-retrieve-spells skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(searchAndRetrieveSpellsSkill, [
			'search_grimoire',
			'inspect_grimoire_item',
			'review_grimoire',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(searchAndRetrieveSpellsSkill, DIRECT_API_NAMES);
	});

	it('simulates: search → inspect top result', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			await inscribeSpellTool.handler(ctx, {
				name: 'deploy-frontend',
				content: spellContent('deploy-frontend', 'Deploy the frontend app'),
			});
			await inscribeSpellTool.handler(ctx, {
				name: 'deploy-backend',
				content: spellContent('deploy-backend', 'Deploy the backend service'),
			});
			await inscribeSpellTool.handler(ctx, {
				name: 'setup-database',
				content: spellContent('setup-database', 'Initialize the database'),
			});

			const searchResult = expectSuccess(
				await searchGrimoireTool.handler(ctx, { query: 'deploy' }),
			);
			ok(searchResult.data.count >= 2, 'expected at least 2 deploy spells');

			const topPath = searchResult.data.results[0]?.path;
			ok(topPath, 'expected first result to have a path');
			const inspectResult = expectSuccess(
				await inspectGrimoireItemTool.handler(ctx, { path: topPath }),
			);
			ok(inspectResult.data.spell.name, 'inspected spell should have a name');
			ok(inspectResult.data.tierInfo, 'inspected spell should have tier info');
		} finally {
			cleanup();
		}
	});

	it('simulates: empty search falls back to chapter review', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			await inscribeSpellTool.handler(ctx, {
				name: 'basic-spell',
				content: spellContent('basic-spell', 'A basic spell'),
			});

			const searchResult = await searchGrimoireTool.handler(ctx, {
				query: 'nonexistent-topic-xyz',
			});
			strictEqual(searchResult.ok, true);
			ok(searchResult.ok && searchResult.data.count === 0, 'search should return zero results');
			const hasEmptyWarning =
				searchResult.ok && searchResult.warnings?.some((w) => w.code === 'empty_result');
			ok(hasEmptyWarning, 'expected empty_result warning');

			const reviewResult = expectSuccess(
				await reviewGrimoireTool.handler(ctx, { view: 'chapters' }),
			);
			ok(reviewResult.data, 'review should return chapter data');
		} finally {
			cleanup();
		}
	});
});
