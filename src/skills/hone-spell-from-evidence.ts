import { defineGrimoireSkill } from './skill_types.ts';

export const honeSpellFromEvidenceSkill = defineGrimoireSkill({
	name: 'hone-spell-from-evidence',
	description:
		'The complete evidence-backed refinement flow: check readiness, gather notes, edit, seal, and distill consumed notes.',
	content: `# Hone Spell From Evidence

Primary tools:
- \`inspect_grimoire_item\` — check spell resonance and current tier
- \`review_grimoire\` — list pending notes as evidence
- \`hone_spell\` — seal edits into a git commit
- \`drop_note\` — capture new observations during refinement
- \`run_catalogue\` — distill consumed notes and update health

Goal:
- Refine an existing spell using accumulated evidence (notes), seal the changes, and clean up consumed notes.

When to use:
- A spell has pending notes that contain evidence for improvement
- The spell's resonance color indicates it needs attention
- You want to advance a spell's rank through evidence-backed edits

When not to use:
- Creating a brand-new spell from scratch — use \`inscribe_spell\` instead
- No notes exist for the target spell — gather evidence first
- The spell is shelved or dormant — unshelve it via \`manage_spell\` before honing

Step-by-step sequence:
1. Use \`inspect_grimoire_item\` with the spell path to check resonance color, current tier, and rank.
2. Use \`review_grimoire\` with view "notes" to list pending notes and identify evidence relevant to the spell.
3. Decide which notes inform the edit. Synthesize their insights into concrete changes.
4. Edit the spell content to incorporate the evidence. Keep changes focused and traceable.
5. Use \`hone_spell\` to seal the updated content into a git commit, advancing the spell's rank.
6. Use \`run_catalogue\` to process the grimoire — this distills consumed notes and updates health scores.
7. Use \`inspect_grimoire_item\` again to verify the rank advanced and resonance reflects the update.

Validation checks:
- Before honing, confirm the spell path exists via \`inspect_grimoire_item\`.
- After sealing, verify the commit hash is returned and rank incremented.
- After catalogue, check that note counts decreased.

Pitfalls:
- Honing with no pending changes produces a no-op — always edit content before sealing.
- Forgetting to \`run_catalogue\` after honing leaves consumed notes unprocessed.
- Editing too many spells at once makes it hard to attribute notes to specific changes.

Tips and tricks:
- Use \`drop_note\` during refinement to capture new observations that arise while reading evidence.
- Check the resonance view via \`review_grimoire\` first to prioritize spells with the most activity.
- Small, focused edits with clear commit messages produce better audit trails.

Tool calls to prefer:
- \`inspect_grimoire_item\` before and after honing to track tier progression
- \`review_grimoire\` with view "notes" to gather evidence
- \`hone_spell\` to seal changes
- \`run_catalogue\` to finalize the cycle

Related skills:
- \`maintain-grimoire-health\` — follow up honing with a health maintenance pass
- \`distill-notes-into-spells\` — when notes warrant a new spell rather than a refinement
`,
});
