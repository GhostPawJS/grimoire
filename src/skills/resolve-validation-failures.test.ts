import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { manageSpellTool } from '../tools/manage_spell_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { resolveValidationFailuresSkill } from './resolve-validation-failures.ts';
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

describe('resolve-validation-failures skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(resolveValidationFailuresSkill, [
			'review_grimoire',
			'inspect_grimoire_item',
			'manage_spell',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(resolveValidationFailuresSkill, DIRECT_API_NAMES);
	});

	it('simulates: review validation → repair_all → verify', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			await inscribeSpellTool.handler(ctx, {
				name: 'alpha',
				content: spellContent('alpha'),
			});
			await inscribeSpellTool.handler(ctx, {
				name: 'beta',
				content: spellContent('beta'),
			});

			const before = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'validation' }));
			ok(before.data, 'validation view should return data');

			const repairResult = expectSuccess(
				await manageSpellTool.handler(ctx, { action: 'repair_all' }),
			);
			ok(repairResult.data, 'repair_all should return data');

			const after = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'validation' }));
			ok(after.data, 'final validation view should return data');
		} finally {
			cleanup();
		}
	});

	it('simulates: empty grimoire has clean validation', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const result = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'validation' }));
			ok(result.data, 'validation view should return data');
			const data = result.data as { invalidCount: number };
			ok(data.invalidCount === 0, 'empty grimoire should have zero validation failures');
		} finally {
			cleanup();
		}
	});
});
