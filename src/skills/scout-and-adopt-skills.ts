import { defineGrimoireSkill } from './skill_types.ts';

export const scoutAndAdoptSkillsSkill = defineGrimoireSkill({
	name: 'scout-and-adopt-skills',
	description:
		'Discover external skills from the ecosystem, evaluate candidates, adopt them into the grimoire with provenance.',
	content: `# Scout and Adopt Skills

Primary tools:
- \`scout_skills\`
- \`inspect_grimoire_item\`
- \`review_grimoire\`

Goal:
- Find useful skills from external sources (AgentSkillHub, GitHub repos, URLs).
- Evaluate candidates against what already exists in the grimoire.
- Adopt selected skills with full provenance tracking.
- Verify adopted spells integrate cleanly.

When to use:
- The grimoire needs new capabilities that others have already built.
- A user asks to import or discover community skills.
- You want to bootstrap a grimoire with curated external content.

When not to use:
- Writing original spells from scratch — use \`inscribe_spell\` instead.
- Updating an already-adopted spell — see the reconcile-upstream-updates skill.
- Reorganizing existing local spells — see the reorganize-spell-chapters skill.

Step-by-step sequence:
1. Call \`scout_skills\` with \`action: "search"\` and a descriptive query to find candidate skills.
2. Review the search results. For each promising candidate, note its source URL and name.
3. Before adopting, call \`search_grimoire\` to check whether a similar spell already exists locally.
4. If no local duplicate exists, call \`scout_skills\` with \`action: "adopt"\` and the candidate's \`source\` URL. Optionally specify a \`chapter\` to place it in.
5. After adoption, call \`inspect_grimoire_item\` on each adopted spell path to verify frontmatter, validation status, and provenance metadata.
6. Call \`review_grimoire\` with \`view: "provenance"\` to confirm provenance records were written.
7. If issues appear during inspection, use \`manage_spell\` to repair or reorganize.

Validation checks:
- Confirm adopted spells have valid frontmatter (\`validation.valid\` should be true).
- Verify provenance records exist linking each spell to its external source.
- Check for duplication warnings in the adoption response.

Pitfalls:
- Never adopt without searching locally first — duplicates cause confusion.
- Adoption requires a database; if the context has no db, the tool returns an error.
- Bulk-adopting many spells at once can clutter a single chapter — spread across chapters.
- External sources may be unavailable; handle network errors gracefully.

Tips and tricks:
- Use broad search queries first, then narrow with specific terms.
- Adopt into a dedicated chapter like "imported" or "community" for easy review.
- After adopting a batch, run \`review_grimoire\` with \`view: "chapters"\` to verify balance.
- Combine with \`drop_note\` to capture evaluation notes on candidates you chose not to adopt.

Tool calls to prefer:
- \`scout_skills\` with \`action: "search"\` for discovery.
- \`scout_skills\` with \`action: "adopt"\` for importing.
- \`inspect_grimoire_item\` to verify each adopted spell.
- \`review_grimoire\` with \`view: "provenance"\` for audit.

Related skills:
- reconcile-upstream-updates — for keeping adopted spells in sync.
- inscribe-spells-correctly — when writing original content instead.
- search-and-retrieve-spells — for the local duplicate check step.
`,
});
