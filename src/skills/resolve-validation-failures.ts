import { defineGrimoireSkill } from './skill_types.ts';

export const resolveValidationFailuresSkill = defineGrimoireSkill({
	name: 'resolve-validation-failures',
	description:
		'Systematically diagnose and fix structural validation failures across the grimoire.',
	content: `# Resolve Validation Failures

Primary tools:
- \`review_grimoire\`
- \`inspect_grimoire_item\`
- \`manage_spell\`

Goal:
- Bring every spell in the grimoire to a passing validation state by diagnosing root causes and applying targeted repairs.

When to use:
- After bulk imports or migrations that may have introduced malformed frontmatter.
- When \`review_grimoire\` with view "validation" reports one or more failures.
- As a periodic maintenance sweep to keep the grimoire structurally sound.

When not to use:
- When the problem is content quality rather than structural validity — that is a curation task.
- When a single spell needs inspection — just call \`inspect_grimoire_item\` directly.

Step-by-step sequence:
1. Call \`review_grimoire\` with view "validation" to get a full list of failing spells and their error details.
2. Group the failures by error pattern (e.g. missing frontmatter, bad name, empty body) to understand scope.
3. Call \`manage_spell\` with action "repair_all" to auto-fix every structurally repairable issue in one pass.
4. Call \`review_grimoire\` with view "validation" again to see which failures remain after the bulk repair.
5. For each remaining failure, call \`inspect_grimoire_item\` with the spell path to read the full content and understand the specific issue.
6. Apply targeted fixes: use \`manage_spell\` with action "repair" for individual spells, or escalate unfixable spells to the user.
7. Call \`review_grimoire\` with view "validation" one final time to confirm zero failures.

Validation checks:
- The final validation view must show zero invalid spells.
- Every repaired spell should still appear in \`review_grimoire\` with view "chapters".
- No spell should be silently deleted — repairs must preserve content.

Pitfalls:
- Do not skip the initial diagnostic step; running "repair_all" without understanding the failures first may mask deeper issues.
- "repair_all" only fixes auto-repairable problems — manual intervention is still needed for some failures.
- Avoid repeatedly running "repair_all" in a loop; if failures persist after one pass, switch to individual inspection.

Tips and tricks:
- Use the \`next\` hints returned by the validation view — they often point directly to the first spell needing repair.
- After repair_all, compare the before/after invalid counts to confirm progress.
- If a spell is beyond repair, consider shelving it via \`manage_spell\` with action "shelve" rather than deleting.

Tool calls to prefer:
- \`review_grimoire\` with view "validation" for diagnosis.
- \`manage_spell\` with action "repair_all" for bulk fixes.
- \`inspect_grimoire_item\` for deep-diving into stubborn failures.

Related skills:
- \`archive-and-prune-spells\` — for retiring spells that cannot be repaired.
- \`handle-edge-cases-gracefully\` — for dealing with unexpected error states during repair.
`,
});
