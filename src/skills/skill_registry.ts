import { archiveAndPruneSpellsSkill } from './archive-and-prune-spells.ts';
import { decomposeOversizedSpellsSkill } from './decompose-oversized-spells.ts';
import { distillNotesIntoSpellsSkill } from './distill-notes-into-spells.ts';
import { evolveSpellThroughTiersSkill } from './evolve-spell-through-tiers.ts';
import { handleEdgeCasesGracefullySkill } from './handle-edge-cases-gracefully.ts';
import { honeSpellFromEvidenceSkill } from './hone-spell-from-evidence.ts';
import { inscribeSpellsCorrectlySkill } from './inscribe-spells-correctly.ts';
import { maintainGrimoireHealthSkill } from './maintain-grimoire-health.ts';
import { reconcileUpstreamUpdatesSkill } from './reconcile-upstream-updates.ts';
import { reorganizeSpellChaptersSkill } from './reorganize-spell-chapters.ts';
import { resolveValidationFailuresSkill } from './resolve-validation-failures.ts';
import { scoutAndAdoptSkillsSkill } from './scout-and-adopt-skills.ts';
import { searchAndRetrieveSpellsSkill } from './search-and-retrieve-spells.ts';
import type { GrimoireSkillRegistry } from './skill_types.ts';

export const grimoireSkills = [
	searchAndRetrieveSpellsSkill,
	inscribeSpellsCorrectlySkill,
	evolveSpellThroughTiersSkill,
	honeSpellFromEvidenceSkill,
	maintainGrimoireHealthSkill,
	distillNotesIntoSpellsSkill,
	scoutAndAdoptSkillsSkill,
	reconcileUpstreamUpdatesSkill,
	reorganizeSpellChaptersSkill,
	resolveValidationFailuresSkill,
	archiveAndPruneSpellsSkill,
	decomposeOversizedSpellsSkill,
	handleEdgeCasesGracefullySkill,
] satisfies GrimoireSkillRegistry;

export function listGrimoireSkills() {
	return [...grimoireSkills];
}

export function getGrimoireSkillByName(name: string) {
	return grimoireSkills.find((s) => s.name === name) ?? null;
}
