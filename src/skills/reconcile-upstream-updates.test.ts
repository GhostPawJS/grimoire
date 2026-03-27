import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoutSkillsTool } from '../tools/scout_skills_tool.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { reconcileUpstreamUpdatesSkill } from './reconcile-upstream-updates.ts';
import {
	expectError,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
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

describe('reconcile-upstream-updates skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(reconcileUpstreamUpdatesSkill, [
			'scout_skills',
			'inspect_grimoire_item',
			'hone_spell',
			'review_grimoire',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(reconcileUpstreamUpdatesSkill, DIRECT_API_NAMES);
	});

	it('has correct metadata', () => {
		strictEqual(reconcileUpstreamUpdatesSkill.name, 'reconcile-upstream-updates');
		ok(reconcileUpstreamUpdatesSkill.description.length > 0);
		ok(reconcileUpstreamUpdatesSkill.content.startsWith('# Reconcile Upstream Updates'));
	});

	it('content references the three reconciliation strategies', () => {
		ok(reconcileUpstreamUpdatesSkill.content.includes('Auto-apply'));
		ok(reconcileUpstreamUpdatesSkill.content.includes('Manual reconcile'));
		ok(reconcileUpstreamUpdatesSkill.content.includes('Skip'));
	});

	it('content references check_updates and apply_update actions', () => {
		ok(reconcileUpstreamUpdatesSkill.content.includes('action: "check_updates"'));
		ok(reconcileUpstreamUpdatesSkill.content.includes('action: "apply_update"'));
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
			path: 'general/adopted-spell',
		});
		const err = expectError(result);
		ok(err.error.message.includes('database'));
	});
});
