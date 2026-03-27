import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getGrimoireSkillByName, grimoireSkills, listGrimoireSkills } from './skill_registry.ts';
import { expectSkillAvoidsDirectApi } from './skill_test_utils.ts';

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

const TOOL_NAMES = [
	'search_grimoire',
	'review_grimoire',
	'inspect_grimoire_item',
	'inscribe_spell',
	'hone_spell',
	'manage_spell',
	'drop_note',
	'manage_draft',
	'run_catalogue',
	'scout_skills',
];

describe('skill_registry', () => {
	it('contains exactly 13 skills', () => {
		strictEqual(grimoireSkills.length, 13);
	});

	it('has unique skill names', () => {
		const names = new Set(grimoireSkills.map((s) => s.name));
		strictEqual(names.size, grimoireSkills.length);
	});

	it('every skill has non-empty name, description, and content', () => {
		for (const skill of grimoireSkills) {
			ok(skill.name.length > 0, `${skill.name} has empty name`);
			ok(skill.description.length > 0, `${skill.name} has empty description`);
			ok(skill.content.length > 0, `${skill.name} has empty content`);
		}
	});

	it('every skill mentions at least one tool', () => {
		for (const skill of grimoireSkills) {
			const mentionsAny = TOOL_NAMES.some((t) => skill.content.includes(`\`${t}\``));
			ok(mentionsAny, `${skill.name} does not mention any tool`);
		}
	});

	it('no skill references direct API functions', () => {
		for (const skill of grimoireSkills) {
			expectSkillAvoidsDirectApi(skill, DIRECT_API_NAMES);
		}
	});

	it('listGrimoireSkills returns a shallow copy', () => {
		const listed = listGrimoireSkills();
		strictEqual(listed.length, grimoireSkills.length);
		ok(listed !== (grimoireSkills as unknown));
		for (let i = 0; i < listed.length; i++) {
			strictEqual(listed[i], grimoireSkills[i]);
		}
	});

	it('getGrimoireSkillByName finds existing skills', () => {
		const found = getGrimoireSkillByName('search-and-retrieve-spells');
		ok(found !== null);
		strictEqual(found.name, 'search-and-retrieve-spells');
	});

	it('getGrimoireSkillByName returns null for unknown', () => {
		strictEqual(getGrimoireSkillByName('no-such-skill'), null);
	});
});
