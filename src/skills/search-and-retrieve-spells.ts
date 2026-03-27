import { defineGrimoireSkill } from './skill_types.ts';

export const searchAndRetrieveSpellsSkill = defineGrimoireSkill({
	name: 'search-and-retrieve-spells',
	description:
		'Find relevant spells by query, then inspect candidates without scanning the entire grimoire.',
	content: `# Search and Retrieve Spells

Primary tools:
- \`search_grimoire\`
- \`inspect_grimoire_item\`
- \`review_grimoire\`

Goal:
- Locate the most relevant spell(s) for a given topic or keyword.
- Retrieve full details on the best candidates without enumerating every spell.

When to use:
- A user asks for a spell by topic, keyword, or partial name.
- You need to compare several spells before recommending one.
- You want to verify a spell's trustworthiness (tier, rank, validation).

When not to use:
- You already know the exact spell path — jump straight to \`inspect_grimoire_item\`.
- You need to create a new spell — see the inscribe-spells-correctly skill.
- You want a broad overview of all chapters — use \`review_grimoire\` with the "chapters" view directly.

Step-by-step sequence:
1. Call \`search_grimoire\` with a concise query describing the topic.
2. If results come back, pick the top 1–3 candidates by relevance.
3. Call \`inspect_grimoire_item\` on each candidate to retrieve tier, rank, resonance, and validation.
4. If the search returns zero results (look for the "empty_result" warning), fall back to \`review_grimoire\` with view "chapters" to browse available chapters and try a broader query.
5. Evaluate trustworthiness: prefer spells with higher tiers and ranks. An "Uncheckpointed" tier means the spell has never been sealed.
6. Present findings to the user with the spell path, description, and tier/rank summary.

Validation checks:
- After inspecting, confirm \`validation.valid\` is true. If false, suggest running \`manage_spell\` with action "repair".
- If resonance data is available, mention how frequently the spell has been accessed.
- If no git directory is configured, history and tier data may be degraded — note this to the user.

Pitfalls:
- Do not iterate over every spell in the grimoire; use \`search_grimoire\` to narrow down candidates.
- Avoid searching with very short or very generic queries (e.g., "spell") — be specific.
- Do not assume the first result is always the best; inspect at least the top 2–3 when results are close.

Tips and tricks:
- Use the \`chapters\` parameter on \`search_grimoire\` to narrow the search to a specific chapter.
- Chain multiple searches with different keywords if the first attempt returns too few results.
- Use \`review_grimoire\` with view "index" to get a formatted overview if you want to scan titles quickly.

Tool calls to prefer:
- \`search_grimoire\` for discovery.
- \`inspect_grimoire_item\` for deep-diving into a single spell.
- \`review_grimoire\` (view "chapters" or "index") as a fallback when search yields nothing.

Related skills:
- inscribe-spells-correctly — for creating new spells after confirming none exist.
- evolve-spell-through-tiers — for advancing a retrieved spell through tier gates.
`,
});
