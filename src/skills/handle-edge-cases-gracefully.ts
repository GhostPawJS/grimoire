import { defineGrimoireSkill } from './skill_types.ts';

export const handleEdgeCasesGracefullySkill = defineGrimoireSkill({
	name: 'handle-edge-cases-gracefully',
	description:
		'Diagnose unexpected states by reading before mutating, following tool error recovery hints, and refusing to guess.',
	content: `# Handle Edge Cases Gracefully

Primary tools:
- \`inspect_grimoire_item\`
- \`search_grimoire\`
- \`review_grimoire\`

Goal:
- When encountering unexpected tool results — errors, empty results, or ambiguous states — follow a disciplined diagnostic process rather than guessing or retrying blindly.

When to use:
- When a tool call returns an error with a recovery hint.
- When a search returns zero results and you expected matches.
- When an action fails due to an invalid state (e.g. spell not found, validation failure).
- When you are unsure whether a spell exists or what state it is in.

When not to use:
- When everything is working normally — this skill is for exception handling, not routine operations.
- When the error is clearly a user typo — just ask for clarification directly.

Step-by-step sequence:
1. Always start with a read-only diagnostic: call \`inspect_grimoire_item\` or \`search_grimoire\` or \`review_grimoire\` to understand current state before attempting any mutation.
2. If a tool returns an error, read the \`error.recovery\` field — it contains a specific hint for how to proceed.
3. If a tool returns \`needs_clarification\`, read the \`clarification.question\` and \`clarification.missing\` fields to understand what information is needed, then ask the user.
4. If a search returns empty results (look for the \`empty_result\` warning), try broadening the query or checking \`review_grimoire\` with view "chapters" to verify spells exist at all.
5. Only attempt a mutation (inscribe, manage, hone) after the diagnostic step confirms the target exists and is in the expected state.
6. After any corrective mutation, verify the fix by repeating the original read-only check.

Validation checks:
- Never mutate without a preceding diagnostic read.
- Every error recovery path must end with a verification step.
- If the recovery hint suggests a specific tool, use that tool rather than improvising.

Pitfalls:
- Do not retry a failed operation with the same inputs — if it failed once, it will fail again without a state change.
- Do not guess at spell paths — use \`search_grimoire\` to find the correct path.
- Do not ignore warnings on successful results — they may indicate degraded operation (e.g. no database, no git).
- Do not assume an empty search means the grimoire is broken — the query may simply not match.

Tips and tricks:
- The \`next\` field on tool results often contains the exact follow-up action to take — prefer it over ad-hoc decisions.
- Use \`review_grimoire\` with view "chapters" as a baseline sanity check when things seem off.
- Error codes like \`not_found\`, \`invalid_input\`, and \`invalid_state\` each suggest different recovery strategies — read the code to decide.
- When in doubt, gather more information rather than acting. A read is always safe; a write may not be.

Tool calls to prefer:
- \`inspect_grimoire_item\` for understanding a specific spell's state.
- \`search_grimoire\` for finding spells when the path is uncertain.
- \`review_grimoire\` for broad situational awareness.

Related skills:
- \`resolve-validation-failures\` — for systematically fixing validation errors found during diagnosis.
- \`archive-and-prune-spells\` — for handling spells in unexpected states that cannot be repaired.
`,
});
