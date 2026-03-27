import { defineGrimoireSkill } from './skill_types.ts';

export const evolveSpellThroughTiersSkill = defineGrimoireSkill({
	name: 'evolve-spell-through-tiers',
	description:
		'Guide a spell through tier progression by meeting structural requirements at each gate.',
	content: `# Evolve Spell Through Tiers

Primary tools:
- \`inspect_grimoire_item\`
- \`hone_spell\`
- \`review_grimoire\`
- \`manage_spell\`

Goal:
- Advance a spell from its current tier to the next by satisfying structural requirements.
- Understand the tier system and what each gate demands.
- Checkpoint changes via sealing to increment rank and trigger tier promotion.

When to use:
- A spell is stuck at a low tier and you want to promote it.
- You want to understand what a spell needs to reach the next tier.
- After editing spell content and you need to seal to advance rank.

When not to use:
- The spell does not exist yet — use inscribe-spells-correctly first.
- You only need to read a spell — use search-and-retrieve-spells instead.
- The spell has validation errors — fix them with \`manage_spell\` (action "repair") before attempting tier advancement.

Step-by-step sequence:
1. Call \`inspect_grimoire_item\` with the spell path to retrieve current tier, rank, and tier requirements.
2. Read the \`tierInfo\` from the response — it shows the current tier, rank, seals to the next tier, and any structural requirements.
3. Identify what is missing: the tier gate may require a minimum body length, specific sections, or other structural elements.
4. Edit the spell content to meet the requirements (add sections, expand the body, etc.).
5. Call \`hone_spell\` to seal the changes — this creates a git commit and increments the spell's rank.
6. Call \`inspect_grimoire_item\` again to verify the rank increased and check whether the tier was promoted.
7. If the tier did not advance, repeat steps 3–6 until the requirements are met.
8. Use \`review_grimoire\` with view "health" to see how the spell compares to the overall grimoire health.

Validation checks:
- Before sealing, confirm the spell passes validation (\`validation.valid\` should be true).
- After sealing, verify the rank in the response increased by at least 1.
- Check \`tierInfo.sealsToNextTier\` — when it reaches 0, the tier should advance on the next seal.
- If the spell has validation errors, use \`manage_spell\` with action "repair" before sealing.

Pitfalls:
- Sealing without actual content changes results in a no-op — \`hone_spell\` will report no pending changes.
- Do not try to skip tiers; each tier gate must be crossed sequentially.
- Forgetting to check tier requirements before editing wastes effort — always inspect first.
- If no git context is available, sealing is not possible and tier progression cannot occur.

Tips and tricks:
- The tier system typically progresses: Uncheckpointed → Sealed → higher tiers based on rank thresholds.
- Each seal increments rank by 1. Multiple seals over time naturally advance tiers.
- Use \`review_grimoire\` with view "health" to identify which spells across the grimoire are lagging behind.
- Use \`manage_spell\` with action "rollback" if a seal introduced problems — then re-seal after fixing.
- Bulk-seal multiple spells at once by omitting the \`paths\` parameter in \`hone_spell\`.

Tool calls to prefer:
- \`inspect_grimoire_item\` to check current tier state and requirements.
- \`hone_spell\` to seal changes and advance rank.
- \`review_grimoire\` (view "health") to monitor overall progression.
- \`manage_spell\` (action "repair") to fix validation issues before sealing.

Related skills:
- search-and-retrieve-spells — for finding the spell to evolve.
- inscribe-spells-correctly — for creating the spell before evolution begins.
`,
});
