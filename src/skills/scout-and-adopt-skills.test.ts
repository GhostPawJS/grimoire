import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { scoutSkillsTool } from '../tools/scout_skills_tool.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { scoutAndAdoptSkillsSkill } from './scout-and-adopt-skills.ts';
import {
	createSkillTestCtx,
	expectError,
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

describe('scout-and-adopt-skills skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(scoutAndAdoptSkillsSkill, [
			'scout_skills',
			'inspect_grimoire_item',
			'review_grimoire',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(scoutAndAdoptSkillsSkill, DIRECT_API_NAMES);
	});

	it('content references search and adopt actions', () => {
		ok(scoutAndAdoptSkillsSkill.content.includes('action: "search"'));
		ok(scoutAndAdoptSkillsSkill.content.includes('action: "adopt"'));
	});

	it('simulates: adopt without db returns error', async () => {
		const ctxWithoutDb: GrimoireToolContext = { root: '/tmp/grimoire-test' };
		const result = await scoutSkillsTool.handler(ctxWithoutDb, {
			action: 'adopt',
			source: 'https://example.com/skill.md',
		});
		const err = expectError(result);
		ok(err.error.message.includes('database'));
	});

	it('simulates: check_updates without db returns error', async () => {
		const ctxWithoutDb: GrimoireToolContext = { root: '/tmp/grimoire-test' };
		const result = await scoutSkillsTool.handler(ctxWithoutDb, {
			action: 'check_updates',
		});
		const err = expectError(result);
		ok(err.error.message.includes('database'));
	});

	it('simulates: apply_update without db returns error', async () => {
		const ctxWithoutDb: GrimoireToolContext = { root: '/tmp/grimoire-test' };
		const result = await scoutSkillsTool.handler(ctxWithoutDb, {
			action: 'apply_update',
			path: 'general/some-spell',
		});
		const err = expectError(result);
		ok(err.error.message.includes('database'));
	});

	it('has correct metadata', () => {
		strictEqual(scoutAndAdoptSkillsSkill.name, 'scout-and-adopt-skills');
		ok(scoutAndAdoptSkillsSkill.description.length > 0);
		ok(scoutAndAdoptSkillsSkill.content.startsWith('# Scout and Adopt Skills'));
	});

	it('simulates: review provenance on empty grimoire succeeds', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const result = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'provenance' }));
			strictEqual(result.ok, true);
		} finally {
			cleanup();
		}
	});
});
