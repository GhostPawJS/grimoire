import { defineGrimoireSkill } from './skill_types.ts';

export const distillNotesIntoSpellsSkill = defineGrimoireSkill({
	name: 'distill-notes-into-spells',
	description: 'Process accumulated notes into new spells via the draft pipeline.',
	content: `# Distill Notes Into Spells

Primary tools:
- \`review_grimoire\` — review pending notes and drafts
- \`run_catalogue\` — cluster orphan notes and identify potential spell topics
- \`manage_draft\` — submit, approve, or dismiss spell drafts
- \`inscribe_spell\` — create the final spell from an approved draft
- \`drop_note\` — capture additional observations during distillation

Goal:
- Transform accumulated notes into well-structured spells through the draft review pipeline.

When to use:
- Many pending notes have accumulated without corresponding spells
- The catalogue reveals orphan note clusters with suggested terms
- You want to formalize scattered observations into reusable knowledge

When not to use:
- Notes clearly belong to existing spells — use \`hone-spell-from-evidence\` to refine instead
- Only one or two notes exist — wait for more evidence before distilling
- The grimoire needs health maintenance first — run \`maintain-grimoire-health\`

Step-by-step sequence:
1. Use \`review_grimoire\` with view "notes" to see all pending notes and their domains.
2. Use \`run_catalogue\` to cluster orphan notes and identify suggested spell topics.
3. For each promising cluster, use \`manage_draft\` with action "submit" to propose a new spell draft, linking the relevant note IDs.
4. Use \`review_grimoire\` with view "drafts" to review all pending drafts.
5. For drafts that look ready, use \`manage_draft\` with action "approve" to greenlight them.
6. Use \`inscribe_spell\` to create the actual spell from the approved draft content.
7. Use \`run_catalogue\` again to update health scores and process the newly routed notes.
8. Use \`drop_note\` to capture any new observations that emerged during the distillation process.

Validation checks:
- After submitting a draft, the drafts view should list it as pending.
- After approving, the draft status should change and the notes should be linked.
- After inscribing, the spell should appear in \`review_grimoire\` view "chapters".

Pitfalls:
- Submitting a draft without linking note IDs loses the evidence trail.
- Approving a draft does not auto-inscribe — you must still call \`inscribe_spell\`.
- Dismissing a draft does not delete the underlying notes; they remain pending.

Tips and tricks:
- Let the catalogue's orphan clusters guide which drafts to create via \`run_catalogue\`.
- Group related notes by domain when submitting drafts for clearer rationale.
- After inscribing, immediately use \`hone_spell\` on the new spell to seal it and start building rank.

Tool calls to prefer:
- \`review_grimoire\` with view "notes" as the starting point
- \`run_catalogue\` to surface orphan clusters
- \`manage_draft\` for the submit/approve/dismiss pipeline
- \`inscribe_spell\` to materialize approved drafts

Related skills:
- \`hone-spell-from-evidence\` — when notes should refine existing spells rather than create new ones
- \`maintain-grimoire-health\` — run after distillation to verify overall health
`,
});
