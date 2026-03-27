import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inscribeSpellTool } from '../tools/inscribe_spell_tool.ts';
import { manageSpellTool } from '../tools/manage_spell_tool.ts';
import { reviewGrimoireTool } from '../tools/review_grimoire_tool.ts';
import { archiveAndPruneSpellsSkill } from './archive-and-prune-spells.ts';
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

describe('archive-and-prune-spells skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(archiveAndPruneSpellsSkill, [
			'review_grimoire',
			'manage_spell',
			'run_catalogue',
			'inspect_grimoire_item',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(archiveAndPruneSpellsSkill, DIRECT_API_NAMES);
	});

	it('simulates: inscribe → shelve → verify archived', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const inscribed = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'old-spell',
					content: spellContent('old-spell'),
				}),
			);
			const spellPath = (inscribed.data as { spell: { path: string } }).spell.path;

			expectSuccess(await manageSpellTool.handler(ctx, { action: 'shelve', path: spellPath }));

			const chapters = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'chapters' }));
			const chaptersData = chapters.data as { totalSpells: number };
			strictEqual(chaptersData.totalSpells, 0, 'shelved spell should not appear in chapters');
		} finally {
			cleanup();
		}
	});

	it('simulates: inscribe → delete → verify removed', async () => {
		const { ctx, cleanup } = createSkillTestCtx();
		try {
			const inscribed = expectSuccess(
				await inscribeSpellTool.handler(ctx, {
					name: 'dead-spell',
					content: spellContent('dead-spell'),
				}),
			);
			const spellPath = (inscribed.data as { spell: { path: string } }).spell.path;

			expectSuccess(await manageSpellTool.handler(ctx, { action: 'delete', path: spellPath }));

			const chapters = expectSuccess(await reviewGrimoireTool.handler(ctx, { view: 'chapters' }));
			const chaptersData = chapters.data as { totalSpells: number };
			strictEqual(chaptersData.totalSpells, 0, 'deleted spell should not appear in chapters');
		} finally {
			cleanup();
		}
	});
});
