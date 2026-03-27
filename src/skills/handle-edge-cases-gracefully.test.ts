import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { searchGrimoireTool } from '../tools/search_grimoire_tool.ts';
import { handleEdgeCasesGracefullySkill } from './handle-edge-cases-gracefully.ts';
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

describe('handle-edge-cases-gracefully skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(handleEdgeCasesGracefullySkill, [
			'inspect_grimoire_item',
			'search_grimoire',
			'review_grimoire',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(handleEdgeCasesGracefullySkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect non-existent spell returns error with recovery', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const result = expectError(
				await inspectGrimoireItemTool.handler(ctx, { path: 'general/does-not-exist' }),
			);
			ok(result.error, 'error result should have error field');
			strictEqual(result.error.code, 'not_found', 'error code should be not_found');
			ok(result.error.recovery, 'error should include a recovery hint');
		} finally {
			cleanup();
		}
	});

	it('simulates: search for non-existent returns empty with guidance', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const result = expectSuccess(
				await searchGrimoireTool.handler(ctx, { query: 'zzz-nonexistent-xyzzy' }),
			);
			const data = result.data as { count: number };
			strictEqual(data.count, 0, 'search for nonsense should return zero results');
			ok(result.warnings, 'empty search should include warnings');
			ok(result.warnings.length > 0, 'should have at least one warning');
			strictEqual(result.warnings[0]?.code, 'empty_result', 'warning should be empty_result');
		} finally {
			cleanup();
		}
	});
});
