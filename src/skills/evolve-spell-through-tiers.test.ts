import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { honeSpellTool } from '../tools/hone_spell_tool.ts';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { evolveSpellThroughTiersSkill } from './evolve-spell-through-tiers.ts';
import {
	createSkillTestCtxWithGit,
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

describe('evolve-spell-through-tiers skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(evolveSpellThroughTiersSkill, [
			'inspect_grimoire_item',
			'hone_spell',
			'review_grimoire',
			'manage_spell',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(evolveSpellThroughTiersSkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect → hone to advance rank', async () => {
		const { ctx, seal, cleanup } = createSkillTestCtxWithGit();
		try {
			const inscribeResult = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'ci-pipeline',
					content: spellContent('ci-pipeline', 'Continuous integration pipeline'),
				}),
			);
			const spellPath = inscribeResult.data.spell.path;

			seal();

			const honeResult = expectSuccess(await honeSpellTool.handler(ctx, { paths: [spellPath] }));
			ok(honeResult.data.sealedPaths.length > 0, 'should have sealed at least one path');
			ok(honeResult.data.ranks[spellPath] !== undefined, 'rank should be present');
			ok(honeResult.data.ranks[spellPath] >= 1, 'rank should be at least 1 after seal');
		} finally {
			cleanup();
		}
	});

	it('simulates: inspect shows tier requirements', async () => {
		const { ctx, seal, cleanup } = createSkillTestCtxWithGit();
		try {
			const inscribeResult = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'monitoring-alerts',
					content: spellContent('monitoring-alerts', 'Set up monitoring and alerts'),
				}),
			);
			const spellPath = inscribeResult.data.spell.path;

			seal();

			const inspectResult = expectSuccess(
				await inspectGrimoireItemTool.handler(ctx, { path: spellPath }),
			);
			ok(inspectResult.data.tierInfo, 'should have tier info');
			ok(inspectResult.data.tierInfo.tier, 'tier info should include current tier');
			ok(inspectResult.data.tierInfo.rank !== undefined, 'tier info should include current rank');
			ok(
				inspectResult.data.tierInfo.sealsToNextTier !== undefined,
				'tier info should include seals to next tier',
			);
		} finally {
			cleanup();
		}
	});
});
