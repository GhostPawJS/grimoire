import { defineGrimoireSkill } from './skill_types.ts';

export const inscribeSpellsCorrectlySkill = defineGrimoireSkill({
	name: 'inscribe-spells-correctly',
	description:
		'Create new spells with correct structure, always searching first to avoid duplicates.',
	content: `# Inscribe Spells Correctly

Primary tools:
- \`search_grimoire\`
- \`inscribe_spell\`
- \`inspect_grimoire_item\`
- \`hone_spell\`

Goal:
- Write a new spell into the grimoire with valid frontmatter and body structure.
- Prevent accidental duplication by searching before inscribing.
- Immediately checkpoint the new spell so it begins tier progression.

When to use:
- A user wants to record new knowledge, a procedure, or a technique as a spell.
- You have confirmed (via search) that no equivalent spell already exists.

When not to use:
- A similar spell already exists — update it with \`hone_spell\` instead.
- You need to reorganize or archive spells — use \`manage_spell\`.
- The content is temporary or unstructured — use \`drop_note\` instead.

Step-by-step sequence:
1. Call \`search_grimoire\` with keywords from the intended spell name and topic.
2. If the search returns matches, inspect the closest match with \`inspect_grimoire_item\` to decide whether to update the existing spell or create a new one.
3. If no duplicates exist, prepare the spell content with proper frontmatter:
   - The content must start with a YAML frontmatter block (delimited by \`---\`).
   - Required frontmatter fields: \`name\` (kebab-case) and \`description\` (one-line summary).
   - Follow frontmatter with a blank line, then a markdown heading and body.
4. Call \`inscribe_spell\` with the \`name\`, \`content\`, and optional \`chapter\`.
5. Check the response for "duplication_detected" warnings. If present, review the similar spell before proceeding.
6. Call \`inspect_grimoire_item\` on the newly created spell path to verify it was written correctly.
7. If a git context is available, call \`hone_spell\` to seal the new spell and begin its rank/tier progression.

Validation checks:
- Ensure the content includes valid YAML frontmatter with \`name\` and \`description\`.
- The spell body should have at least one markdown heading and meaningful content.
- After inscribing, verify via \`inspect_grimoire_item\` that \`validation.valid\` is true.

Pitfalls:
- Never skip the duplicate search — inscribing a near-duplicate creates confusion and triggers warnings.
- Do not omit the frontmatter block; spells without it will fail validation.
- Avoid overly generic chapter names; check existing chapters with \`review_grimoire\` (view "chapters") first.
- Do not forget to seal after inscribing if git is available — unsealed spells stay at rank 0.

Tips and tricks:
- Use kebab-case for the spell name (e.g., "deploy-to-staging") to keep paths clean.
- Place related spells in the same chapter for discoverability.
- If the user provides raw notes, use \`drop_note\` first, then distill into a spell later.
- Check \`review_grimoire\` with view "chapters" to pick an appropriate chapter before inscribing.

Tool calls to prefer:
- \`search_grimoire\` before every inscribe to check for duplicates.
- \`inscribe_spell\` to create the spell.
- \`inspect_grimoire_item\` to verify the new spell.
- \`hone_spell\` to seal and begin tier progression.

Related skills:
- search-and-retrieve-spells — for the search-before-inscribe step.
- evolve-spell-through-tiers — for advancing the newly created spell.
`,
});
