import { defineGrimoireSkill } from './skill_types.ts';

export const maintainGrimoireHealthSkill = defineGrimoireSkill({
	name: 'maintain-grimoire-health',
	description:
		'Run systematic health maintenance: catalogue, review, remediate stale/dormant/oversized spells.',
	content: `# Maintain Grimoire Health

Primary tools:
- \`run_catalogue\` — run the full maintenance pass to detect issues
- \`review_grimoire\` — review health dashboard and validation results
- \`manage_spell\` — shelve dormant spells, repair broken ones
- \`inspect_grimoire_item\` — drill into individual spells flagged by the catalogue

Goal:
- Systematically detect and resolve grimoire health issues: stale spells, dormant spells, oversized content, validation errors, and unbalanced chapters.

When to use:
- Periodically as routine maintenance
- After a batch of inscriptions or honing sessions
- When the grimoire feels disorganized or health scores are unknown
- Before presenting grimoire status to users

When not to use:
- When focused on a single spell — use \`inspect_grimoire_item\` and \`hone_spell\` directly
- When the grimoire is empty — there is nothing to maintain
- When only notes need processing — use \`distill-notes-into-spells\` instead

Step-by-step sequence:
1. Use \`run_catalogue\` to execute the full maintenance pass. This detects stale, dormant, and oversized spells, routes notes, clusters orphans, and computes health scores.
2. Use \`review_grimoire\` with view "health" to read the catalogue snapshot and identify problem areas.
3. For each dormant spell flagged, use \`manage_spell\` with action "shelve" to archive it.
4. For spells with validation errors, use \`manage_spell\` with action "repair" or "repair_all" to fix structural issues.
5. Use \`inspect_grimoire_item\` on any spell with low health scores to understand what needs attention.
6. Use \`review_grimoire\` with view "validation" to confirm repairs resolved all issues.
7. Optionally, use \`review_grimoire\` with view "chapters" to check chapter balance.

Validation checks:
- After catalogue, the snapshot should report zero or fewer issues than before.
- After repair_all, the validation view should show no invalid spells.
- Dormant spells should disappear from the active health snapshot after shelving.

Pitfalls:
- Running \`run_catalogue\` on a very large grimoire may take time — do not skip the health review afterward.
- Shelving a spell that still has pending notes will orphan those notes.
- repair_all fixes structural issues only — content quality must be assessed manually.

Tips and tricks:
- Run \`run_catalogue\` before and after remediation to measure improvement.
- Use the "health" view to prioritize: fix validation errors first, then address stale and dormant spells.
- Combine with \`review_grimoire\` view "resonance" to identify high-activity spells that deserve attention.

Tool calls to prefer:
- \`run_catalogue\` as the entry point for every maintenance session
- \`review_grimoire\` with view "health" and view "validation"
- \`manage_spell\` with action "repair_all" for bulk fixes

Related skills:
- \`hone-spell-from-evidence\` — refine spells identified as needing updates
- \`distill-notes-into-spells\` — process orphan note clusters into new spells
`,
});
