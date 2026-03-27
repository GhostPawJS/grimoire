import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { inspectGrimoireItemTool } from '../tools/inspect_grimoire_item_tool.ts';
import { searchGrimoireTool } from '../tools/search_grimoire_tool.ts';
import { inscribeSpellsCorrectlySkill } from './inscribe-spells-correctly.ts';
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

describe('inscribe-spells-correctly skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(inscribeSpellsCorrectlySkill, [
			'search_grimoire',
			'inscribe_spell',
			'inspect_grimoire_item',
			'hone_spell',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(inscribeSpellsCorrectlySkill, DIRECT_API_NAMES);
	});

	it('simulates: search → inscribe → inspect new spell', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const searchResult = expectSuccess(
				await searchGrimoireTool.handler(ctx, { query: 'logging-setup' }),
			);
			strictEqual(searchResult.data.count, 0, 'no existing spells expected');

			const inscribeResult = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'logging-setup',
					content: spellContent('logging-setup', 'Configure application logging'),
				}),
			);
			ok(inscribeResult.data.spell.path, 'inscribed spell should have a path');

			const inspectResult = expectSuccess(
				await inspectGrimoireItemTool.handler(ctx, {
					path: inscribeResult.data.spell.path,
				}),
			);
			strictEqual(inspectResult.data.spell.name, 'logging-setup');
			ok(inspectResult.data.validation, 'should have validation data');
		} finally {
			cleanup();
		}
	});

	it('simulates: duplicate detection on second inscribe', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'cache-strategy',
					content: spellContent('cache-strategy', 'Caching strategy for the API'),
				}),
			);

			const secondResult = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'cache-strategies',
					content: spellContent('cache-strategies', 'Caching strategies for the API layer'),
				}),
			);
			const hasDuplicationWarning = secondResult.warnings?.some(
				(w) => w.code === 'duplication_detected',
			);
			ok(hasDuplicationWarning, 'expected duplication_detected warning for similar spell');
		} finally {
			cleanup();
		}
	});
});
