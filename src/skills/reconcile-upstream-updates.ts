import { defineGrimoireSkill } from './skill_types.ts';

export const reconcileUpstreamUpdatesSkill = defineGrimoireSkill({
	name: 'reconcile-upstream-updates',
	description:
		'Check for upstream changes on adopted spells and decide whether to auto-apply, manually reconcile, or keep local evolution.',
	content: `# Reconcile Upstream Updates

Primary tools:
- \`scout_skills\`
- \`inspect_grimoire_item\`
- \`hone_spell\`
- \`review_grimoire\`

Goal:
- Detect when adopted spells have upstream changes available.
- Decide per-spell whether to auto-apply the update, manually reconcile, or skip.
- Seal reconciled changes to advance ranks and preserve history.

When to use:
- Periodically checking if community spells have been improved upstream.
- After being notified that a source repository has new releases.
- During maintenance sweeps of adopted content.

When not to use:
- The spell was written locally with no provenance — there is no upstream to check.
- You want to adopt a new spell — use the scout-and-adopt-skills skill instead.
- You need to reorganize chapters — use the reorganize-spell-chapters skill.

Step-by-step sequence:
1. Call \`scout_skills\` with \`action: "check_updates"\` to get a list of spells with available upstream changes.
2. For each spell with an update, call \`inspect_grimoire_item\` to review the current local state, tier, and provenance.
3. Decide the reconciliation strategy:
   a. **Auto-apply**: If the local spell has no manual edits since adoption, call \`scout_skills\` with \`action: "apply_update"\` and the spell \`path\`.
   b. **Manual reconcile**: If local edits exist, review both versions and use \`hone_spell\` to seal a merged version.
   c. **Skip**: If the local evolution is preferable, leave it unchanged and document the decision with \`drop_note\`.
4. After applying or reconciling, call \`inspect_grimoire_item\` again to verify the spell is valid.
5. If changes were applied, call \`hone_spell\` to seal and advance the rank.
6. Call \`review_grimoire\` with \`view: "provenance"\` to verify provenance was updated.

Validation checks:
- After auto-apply, confirm \`validation.valid\` is true via \`inspect_grimoire_item\`.
- Verify the provenance record reflects the new upstream version.
- Check that the spell rank advanced after sealing.

Pitfalls:
- Auto-applying over local edits destroys manual improvements — always check history first.
- The check_updates and apply_update actions require a database; handle the no-db error.
- Network failures during update checks are transient — retry before giving up.
- Skipping updates without documentation makes future audits harder.

Tips and tricks:
- Run \`review_grimoire\` with \`view: "provenance"\` first to see which spells are adopted.
- Use \`inspect_grimoire_item\` to compare the current rank/tier before and after updates.
- For contested reconciliations, use \`drop_note\` to record the rationale for the chosen version.
- Schedule periodic update checks rather than checking on every session.

Tool calls to prefer:
- \`scout_skills\` with \`action: "check_updates"\` for detection.
- \`scout_skills\` with \`action: "apply_update"\` for auto-apply.
- \`inspect_grimoire_item\` for before/after comparison.
- \`hone_spell\` to seal reconciled changes.
- \`review_grimoire\` with \`view: "provenance"\` for audit.

Related skills:
- scout-and-adopt-skills — for the initial adoption workflow.
- evolve-spell-through-tiers — for understanding rank progression after updates.
`,
});
