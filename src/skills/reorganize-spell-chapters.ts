import { defineGrimoireSkill } from './skill_types.ts';

export const reorganizeSpellChaptersSkill = defineGrimoireSkill({
	name: 'reorganize-spell-chapters',
	description:
		'Restructure chapter layout by moving, shelving, and unshelving spells to achieve balanced organization.',
	content: `# Reorganize Spell Chapters

Primary tools:
- \`review_grimoire\`
- \`manage_spell\`
- \`inspect_grimoire_item\`

Goal:
- Audit the current chapter structure and spell distribution.
- Move spells between chapters to improve thematic grouping.
- Shelve inactive or deprecated spells to reduce clutter.
- Unshelve previously archived spells when they become relevant again.

When to use:
- Chapters have grown unbalanced (some huge, others nearly empty).
- New thematic groupings have emerged that better reflect the grimoire's content.
- A maintenance sweep is needed to archive stale spells.
- Previously shelved spells need to be restored after a change in priorities.

When not to use:
- Creating new spells — use \`inscribe_spell\`.
- Editing spell content — use \`hone_spell\` to seal changes.
- Adopting external spells — use the scout-and-adopt-skills skill.

Step-by-step sequence:
1. Call \`review_grimoire\` with \`view: "chapters"\` to get the current chapter layout and spell counts.
2. Identify imbalances: chapters with too many spells, orphaned chapters, or thematic mismatches.
3. For spells that belong in a different chapter, call \`manage_spell\` with \`action: "move"\`, providing the current \`path\` and the \`target\` path in the new chapter.
4. For stale or deprecated spells, call \`manage_spell\` with \`action: "shelve"\` to archive them.
5. For previously shelved spells that are relevant again, call \`manage_spell\` with \`action: "unshelve"\` using the shelved path.
6. After all moves, call \`review_grimoire\` with \`view: "chapters"\` again to verify the new layout is balanced.
7. Optionally call \`inspect_grimoire_item\` on moved spells to confirm they are still valid.

Validation checks:
- After moves, verify spell paths resolve correctly with \`inspect_grimoire_item\`.
- Confirm the chapter distribution is more balanced via \`review_grimoire\`.
- Check that shelved spells no longer appear in the active chapter listing.
- Verify unshelved spells appear in their target chapter.

Pitfalls:
- Moving a spell changes its path — any external references to the old path will break.
- Shelving is reversible but unshelving requires knowing the original shelved path (prefixed with \`.shelved/\`).
- Moving into a non-existent chapter creates it implicitly; be intentional about naming.
- Do not move and shelve the same spell in one sequence — move first, then shelve if needed.

Tips and tricks:
- Start with \`review_grimoire\` view "chapters" to get a bird's-eye view before making changes.
- Use \`search_grimoire\` to find spells by topic when deciding which chapter they belong in.
- Move related spells together to maintain thematic cohesion.
- After a large reorganization, run \`review_grimoire\` with \`view: "validation"\` to catch any breakage.
- Use \`drop_note\` to document the rationale behind a major reorganization.

Tool calls to prefer:
- \`review_grimoire\` with \`view: "chapters"\` for auditing layout.
- \`manage_spell\` with \`action: "move"\` for relocating spells.
- \`manage_spell\` with \`action: "shelve"\` for archiving.
- \`manage_spell\` with \`action: "unshelve"\` for restoring.
- \`inspect_grimoire_item\` for verifying moved spells.

Related skills:
- inscribe-spells-correctly — for creating new spells in the right chapter.
- search-and-retrieve-spells — for finding spells to move.
- evolve-spell-through-tiers — moving does not reset rank/tier progression.
`,
});
