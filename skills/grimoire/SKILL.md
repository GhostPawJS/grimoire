---
name: grimoire
description: "Store, search, and maintain procedural knowledge as local spells with notes and revision history. Use when maintaining procedures or capturing practical knowledge."
license: "MIT"
compatibility: "Node.js 24 or newer. MCP stdio or ghostpaw-grimoire CLI."
---

# grimoire

Grimoire manages local procedural knowledge as spells, notes, and drafts. Search before creating a spell. Inspect before updating, then hone to seal revisions. Preserve provenance and use scouting only when external acquisition is intended.

## Calling tools

MCP: connect to ghostpaw-grimoire, then call a tool by name with its JSON arguments.

CLI: `ghostpaw-grimoire call <tool> '<JSON object>'` or `ghostpaw-grimoire <tool> --parameter value` (without a global install: `npx -y @ghostpaw/grimoire <tool> ...`).

Inspect schemas with `ghostpaw-grimoire describe <tool>`. Use `--db <path>` to select a database.

## search_grimoire

Search the grimoire for spells by name or description.

Use when: When looking for spells matching a keyword, topic, or partial name.

Not for: When you already know the exact spell path — use inspect_grimoire_item instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| query | string | yes | Search query |
| chapters | array | no | Chapters to filter by |

## review_grimoire

Review a dashboard view of the grimoire — chapters, health, resonance, notes, drafts, validation, provenance, or index.

Use when: When you need a broad overview of grimoire state from a specific angle.

Not for: When you need details about a single spell — use inspect_grimoire_item instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| view | string | yes | chapters, health, resonance, notes, drafts, validation, provenance, index. Review view |
| limit | integer | no | Maximum results to return |
| now | integer | no | Timestamp override |

## inspect_grimoire_item

Inspect a single spell in detail, including tier, resonance, validation, provenance, and history.

Use when: When you need full details about a specific spell by its path.

Not for: When you want a broad overview — use review_grimoire instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| path | string | yes | Spell path |

## inscribe_spell

Create a new spell in the grimoire.

Use when: When writing a new skill/spell into the grimoire from scratch.

Not for: When updating existing spell content — use update_spell to edit, then hone_spell to seal.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| name | string | yes | Spell name |
| content | string | yes | Spell body content in markdown |
| chapter | string | no | Chapter name |
| force | boolean | no | Replace an existing spell at the same path. Default false. |

## update_spell

Write new content to an existing spell, leaving the change uncommitted.

Use when: When incorporating note evidence or improvements into an existing spell body. Follow with hone_spell to seal and advance rank.

Not for: When creating a brand-new spell — use inscribe_spell instead. When you only want to checkpoint existing edits — use hone_spell directly.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| path | string | yes | Spell path |
| content | string | yes | Full spec-compliant SKILL.md content |

## hone_spell

Seal pending spell changes into a git commit, advancing spell ranks.

Use when: After editing spell content with update_spell, to checkpoint changes and evolve spell tiers. Pass note_ids to mark which notes were absorbed during this honing session.

Not for: When no changes have been made — the tool will return a no-op.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| paths | array | no | Spell paths to seal |
| message | string | no | Commit message |
| note_ids | array | no | Note IDs to distill after sealing |

## manage_spell

Manage spells: shelve, unshelve, move, delete, repair, repair all, or rollback to a previous seal.

Use when: When you need to reorganize, archive, restore, move, remove, fix, or revert spells.

Not for: When creating new spells — use inscribe_spell. When sealing changes — use hone_spell.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | shelve, unshelve, move, delete, repair, repair_all, rollback. The management action to perform: shelve, unshelve, move, delete, repair, repair_all, or rollback. |
| force | boolean | no | Replace an existing spell at the same path. Default false. |
| path | string | no | Spell path — required for all actions except repair_all. |
| target | string | no | Target path — required for move. |
| ref | string | no | Git commit hash to revert to — required for rollback. Use inspect_grimoire_item to find seal hashes from history. |

## drop_note

Drop an observation note into the grimoire for later cataloguing.

Use when: When capturing an insight, observation, or piece of evidence about a spell topic.

Not for: When creating or editing a spell directly — use inscribe_spell or hone_spell.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| content | string | yes | Note content |
| source | string | yes | Source identifier |
| domain | string | no | Topic domain |

## manage_draft

Submit, approve, or dismiss spell drafts.

Use when: When managing the draft pipeline — proposing new spells from notes, approving, or dismissing drafts.

Not for: When creating spells directly — use inscribe_spell instead.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | submit, approve, dismiss. Draft action to perform: submit, approve, or dismiss. |
| title | string | no | Draft title — required for submit. |
| rationale | string | no | Why this draft should become a spell — required for submit. |
| noteIds | array | no | Note IDs backing this draft — required for submit. |
| chapter | string | no | Chapter for the potential spell — required for submit. |
| draftId | integer | no | Draft ID — required for approve and dismiss. |

## run_catalogue

Run the full catalogue maintenance pass — detect stale/dormant/oversized spells, route notes, cluster orphans, compute health.

Use when: Periodically or after dropping many notes to process and analyze grimoire health.

Not for: When just reading health data — use review_grimoire with view "health" instead.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| now | integer | no | Timestamp override (ms) |

## scout_skills

Scout, search, adopt, and update spells from external sources.

Use when: When discovering new skills from AgentSkillHub or GitHub, importing them, or checking for upstream updates.

Not for: When working with local spells only — use inscribe_spell or hone_spell.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | adopt, search, check_updates, apply_update. Scout action to perform: adopt (import from source), search (find skills), check_updates, or apply_update. |
| source | string | no | Source URL or identifier — required for adopt. |
| chapter | string | no | Chapter for adopted spells — optional for adopt. |
| query | string | no | Search query — required for search. |
| path | string | no | Spell path — required for apply_update. |

## Workflow guides

- [search-and-retrieve-spells](references/search-and-retrieve-spells.md): Find relevant spells by query, then inspect candidates without scanning the entire grimoire.
- [inscribe-spells-correctly](references/inscribe-spells-correctly.md): Create new spells with correct structure, always searching first to avoid duplicates.
- [evolve-spell-through-tiers](references/evolve-spell-through-tiers.md): Guide a spell through tier progression by meeting structural requirements at each gate.
- [hone-spell-from-evidence](references/hone-spell-from-evidence.md): The complete evidence-backed refinement flow: check readiness, gather notes, edit, seal, and distill consumed notes.
- [maintain-grimoire-health](references/maintain-grimoire-health.md): Run systematic health maintenance: catalogue, review, remediate stale/dormant/oversized spells.
- [distill-notes-into-spells](references/distill-notes-into-spells.md): Process accumulated notes into new spells via the draft pipeline.
- [scout-and-adopt-skills](references/scout-and-adopt-skills.md): Discover external skills from the ecosystem, evaluate candidates, adopt them into the grimoire with provenance.
- [reconcile-upstream-updates](references/reconcile-upstream-updates.md): Check for upstream changes on adopted spells and decide whether to auto-apply, manually reconcile, or keep local evolution.
- [reorganize-spell-chapters](references/reorganize-spell-chapters.md): Restructure chapter layout by moving, shelving, and unshelving spells to achieve balanced organization.
- [resolve-validation-failures](references/resolve-validation-failures.md): Systematically diagnose and fix structural validation failures across the grimoire.
- [archive-and-prune-spells](references/archive-and-prune-spells.md): Identify dead weight and retire it using the correct archival action.
- [decompose-oversized-spells](references/decompose-oversized-spells.md): Split an oversized spell into focused modules, migrating content while preserving knowledge.
- [handle-edge-cases-gracefully](references/handle-edge-cases-gracefully.md): Diagnose unexpected states by reading before mutating, following tool error recovery hints, and refusing to guess.

## Principles

- Search before writing. Preserve provenance. Seal changes after review.
