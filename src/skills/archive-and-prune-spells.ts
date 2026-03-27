import { defineGrimoireSkill } from './skill_types.ts';

export const archiveAndPruneSpellsSkill = defineGrimoireSkill({
	name: 'archive-and-prune-spells',
	description: 'Identify dead weight and retire it using the correct archival action.',
	content: `# Archive and Prune Spells

Primary tools:
- \`review_grimoire\`
- \`manage_spell\`
- \`run_catalogue\`
- \`inspect_grimoire_item\`

Goal:
- Identify dormant, stale, or unused spells and retire them through shelving (reversible archive) or deletion (permanent removal), keeping the grimoire lean and relevant.

When to use:
- When the catalogue reports dormant or stale spells that are no longer useful.
- During periodic housekeeping to reduce clutter and improve search relevance.
- When a chapter has grown too large and needs pruning.

When not to use:
- When the spell is still actively referenced — check resonance first.
- When you want to split a spell into parts rather than remove it — use the decompose skill instead.
- When the spell just needs structural repair — use the resolve-validation-failures skill.

Step-by-step sequence:
1. Call \`run_catalogue\` to compute a fresh health snapshot — this identifies dormant, stale, and oversized spells.
2. Call \`review_grimoire\` with view "health" to read the catalogue results and list candidates for archival.
3. For each candidate, call \`inspect_grimoire_item\` with the spell path to verify it is truly unused and understand its content.
4. Decide per spell: use \`manage_spell\` with action "shelve" to archive reversibly (preserves history, can unshelve later), or action "delete" to permanently remove (irreversible).
5. After processing all candidates, call \`run_catalogue\` again to refresh the health snapshot.
6. Call \`review_grimoire\` with view "health" to verify the dormant list is now empty or reduced.

Validation checks:
- Shelved spells must no longer appear in the main chapter listing from \`review_grimoire\` with view "chapters".
- Deleted spells must be completely absent from all views.
- The catalogue health snapshot should show fewer dormant spells after pruning.

Pitfalls:
- Never delete a spell without inspecting it first — it may contain valuable knowledge worth shelving instead.
- Shelving is reversible; deletion is not. Default to shelving when uncertain.
- Do not prune spells that have high resonance scores — they may appear dormant by catalogue heuristics but are still being read.

Tips and tricks:
- The \`next\` hints from \`run_catalogue\` often suggest shelving specific dormant spells — follow them.
- Check resonance data via \`review_grimoire\` with view "resonance" before deleting, to avoid removing spells that are still accessed.
- Process spells in batches by chapter for a more organized workflow.

Tool calls to prefer:
- \`run_catalogue\` to identify candidates.
- \`inspect_grimoire_item\` to verify before acting.
- \`manage_spell\` with action "shelve" as the safe default.

Related skills:
- \`resolve-validation-failures\` — repair before pruning; don't prune fixable spells.
- \`decompose-oversized-spells\` — split rather than archive if the content is still useful.
`,
});
