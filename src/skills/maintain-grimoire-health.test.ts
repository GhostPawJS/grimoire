import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { manageSpellTool } from '../tools/manage_spell_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { runCatalogueTool } from '../tools/run_catalogue_tool.ts';
import { maintainGrimoireHealthSkill } from './maintain-grimoire-health.ts';
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

describe('maintain-grimoire-health skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(maintainGrimoireHealthSkill, [
			'run_catalogue',
			'review_grimoire',
			'manage_spell',
			'inspect_grimoire_item',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(maintainGrimoireHealthSkill, DIRECT_API_NAMES);
	});

	it('simulates: catalogue → review health → repair', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'spell-alpha',
					content: spellContent('spell-alpha'),
				}),
			);
			expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'spell-beta',
					content: spellContent('spell-beta'),
				}),
			);

			const catResult = expectSuccess(await runCatalogueTool.handler(ctx, {}));
			ok(catResult.ok);

			const healthResult = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'health' }));
			ok(healthResult.ok);

			const repairResult = expectSuccess(
				await manageSpellTool.handler(ctx, { action: 'repair_all' }),
			);
			ok(repairResult.ok);
		} finally {
			cleanup();
		}
	});

	it('simulates: empty grimoire produces healthy snapshot', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const catResult = expectSuccess(await runCatalogueTool.handler(ctx, {}));
			ok(catResult.ok);

			const healthResult = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'health' }));
			ok(healthResult.ok);
			const snapshot = (healthResult.data as Record<string, unknown>).snapshot;
			ok(snapshot !== undefined);
			strictEqual((snapshot as Record<string, unknown>).totalSpells, 0);
		} finally {
			cleanup();
		}
	});
});
