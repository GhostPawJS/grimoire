import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	archiveAndPruneSpellsSkill,
	decomposeOversizedSpellsSkill,
	defineGrimoireSkill,
	distillNotesIntoSpellsSkill,
	evolveSpellThroughTiersSkill,
	getGrimoireSkillByName,
	grimoireSkills,
	handleEdgeCasesGracefullySkill,
	honeSpellFromEvidenceSkill,
	inscribeSpellsCorrectlySkill,
	listGrimoireSkills,
	maintainGrimoireHealthSkill,
	reconcileUpstreamUpdatesSkill,
	reorganizeSpellChaptersSkill,
	resolveValidationFailuresSkill,
	scoutAndAdoptSkillsSkill,
	searchAndRetrieveSpellsSkill,
} from './index.ts';

describe('skills/index barrel', () => {
	it('re-exports all 13 skill definitions', () => {
		ok(searchAndRetrieveSpellsSkill);
		ok(inscribeSpellsCorrectlySkill);
		ok(evolveSpellThroughTiersSkill);
		ok(honeSpellFromEvidenceSkill);
		ok(maintainGrimoireHealthSkill);
		ok(distillNotesIntoSpellsSkill);
		ok(scoutAndAdoptSkillsSkill);
		ok(reconcileUpstreamUpdatesSkill);
		ok(reorganizeSpellChaptersSkill);
		ok(resolveValidationFailuresSkill);
		ok(archiveAndPruneSpellsSkill);
		ok(decomposeOversizedSpellsSkill);
		ok(handleEdgeCasesGracefullySkill);
	});

	it('re-exports registry helpers', () => {
		ok(Array.isArray(grimoireSkills));
		strictEqual(typeof listGrimoireSkills, 'function');
		strictEqual(typeof getGrimoireSkillByName, 'function');
	});

	it('re-exports defineGrimoireSkill', () => {
		strictEqual(typeof defineGrimoireSkill, 'function');
	});

	it('listGrimoireSkills returns a copy distinct from the registry', () => {
		const listed = listGrimoireSkills();
		ok(listed !== (grimoireSkills as unknown));
		strictEqual(listed.length, grimoireSkills.length);
	});
});
