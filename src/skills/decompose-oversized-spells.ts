import { defineGrimoireSkill } from './skill_types.ts';

export const decomposeOversizedSpellsSkill = defineGrimoireSkill({
	name: 'decompose-oversized-spells',
	description:
		'Split an oversized spell into focused modules, migrating content while preserving knowledge.',
	content: `# Decompose Oversized Spells

Primary tools:
- \`inspect_grimoire_item\`
- \`inscribe_spell\`
- \`manage_spell\`
- \`hone_spell\`
- \`review_grimoire\`

Goal:
- Take a spell that has grown too large and break it into smaller, focused spells — each covering a distinct section of the original — then retire the original while preserving all knowledge.

When to use:
- When the catalogue flags a spell as oversized.
- When a spell covers multiple distinct topics that would be better served as separate spells.
- When a spell's body has grown beyond the point where it is easy to navigate or maintain.

When not to use:
- When the spell is large but cohesive — size alone is not a reason to split.
- When the spell is dormant — consider archiving it instead of decomposing.
- When the content is duplicated elsewhere — deduplicate rather than split.

Step-by-step sequence:
1. Call \`inspect_grimoire_item\` with the oversized spell path to read its full content, frontmatter, validation state, and tier.
2. Identify distinct sections or topics within the body that can stand alone as independent spells.
3. For each identified section, call \`inscribe_spell\` with a focused name, the extracted content, and the appropriate chapter.
4. Call \`review_grimoire\` with view "validation" to verify all newly inscribed spells pass structural validation.
5. If git is available, call \`hone_spell\` to seal the new spells, checkpointing the decomposition.
6. Call \`manage_spell\` with action "shelve" on the original oversized spell to archive it — preserving its history while removing it from the active grimoire.
7. Call \`review_grimoire\` with view "chapters" to confirm the new spells are present and the original is gone.

Validation checks:
- Each new spell must pass validation (check via \`review_grimoire\` with view "validation").
- The original spell must be shelved, not deleted — its history may be valuable.
- The total content across new spells should cover all sections from the original.
- No orphaned references should remain pointing to the old spell path.

Pitfalls:
- Do not create too many tiny spells — each should have enough substance to be useful on its own.
- Do not delete the original before verifying the new spells pass validation.
- Frontmatter (name, description) must be unique per new spell — do not copy the original's name.

Tips and tricks:
- Name new spells by their specific focus area, using the original's name as a prefix for discoverability.
- Place all parts in the same chapter as the original unless a different chapter is a better fit.
- Use \`search_grimoire\` after decomposition to verify the new spells are findable by the same queries the original would have matched.

Tool calls to prefer:
- \`inspect_grimoire_item\` to understand the original before splitting.
- \`inscribe_spell\` to create each focused part.
- \`manage_spell\` with action "shelve" to retire the original.

Related skills:
- \`archive-and-prune-spells\` — when the spell should be retired outright rather than decomposed.
- \`resolve-validation-failures\` — to fix any validation issues in the new spells.
`,
});
