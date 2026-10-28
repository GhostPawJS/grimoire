---
name: grimoire
description: "Store, search, and maintain procedural knowledge as local spells with notes and revision history. Use when maintaining procedures or capturing practical knowledge."
license: "MIT"
compatibility: "Release binary needs no runtime installation. MCP stdio or ghostpaw-grimoire CLI."
---

# grimoire

## Install

Install the release binary; the installer verifies SHA256SUMS. Add ~/.local/bin to PATH.

```sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/grimoire/main/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
```

On Windows, use install.ps1 from the same repository; it also verifies SHA256SUMS.

## CLI cheat sheet

State: DB = --db / GHOSTPAW_GRIMOIRE_DB / ~/.ghostpaw/grimoire.db; root = --root / GHOSTPAW_GRIMOIRE_ROOT / ~/.ghostpaw/grimoire.
Git history lives at <ROOT>/.grimoire-git; override with --git-dir or GHOSTPAW_GRIMOIRE_GIT_DIR.
A spell is <chapter>/<name>/SKILL.md with optional scripts/, references/, and assets/. Copy the folder to export it.
Rank counts distinct commits per spell: Uncheckpointed 0, Apprentice 1–2, Journeyman 3–5, Expert 6–9, Master 10+.
Search uses multiple terms across names, descriptions, and bodies with stemming and fuzzy metadata matching.
Inscribe conflicts when the destination exists; --force replaces it. Identical content and no-change hone return no_op.
Hone accepts positional paths and --paths. Both --note-ids and --note_ids work for hone and draft submit.
Inspect shows rollback hashes in history. Updates require hone to checkpoint changes.
Spell --content accepts @file, @- for stdin and @@ for a literal leading @; every other value is literal. A final - reads JSON stdin (including spell inscribe <name> -).
--now accepts epoch milliseconds, ISO 8601 date-time, and YYYY-MM-DD. Inspect history and catalogue dates are ISO.
Write results are compact; --verbose includes full spell content. review index --format prompt returns only the formatted block in data.
Output: --json, --compact, --quiet. Exit codes: 0 success/no_op, 1 tool error, 2 usage, 3 not found/clarification, 4 conflict, 70 internal error.
Catalogue health fields measure honing pressure; recently sealed spells may score zero. Dormancy has a 14-day grace period after the first seal.

```sh
ghostpaw-grimoire search 'post image VPS'
ghostpaw-grimoire search 'set up a recurring reminder'
ghostpaw-grimoire review index
ghostpaw-grimoire review index --format prompt
ghostpaw-grimoire inspect ops/verify-release
ghostpaw-grimoire spell inscribe verify-release --content @SKILL.md --chapter ops
ghostpaw-grimoire spell inscribe verify-release --force --content @SKILL.md --chapter ops
ghostpaw-grimoire spell inscribe verify-release -
ghostpaw-grimoire spell update ops/verify-release --content @-
ghostpaw-grimoire spell hone ops/verify-release --message 'Add recovery' --note-ids 3
ghostpaw-grimoire spell hone --paths ops/verify-release --note_ids 3
ghostpaw-grimoire note drop 'Checksum mismatch' --source failure --domain ops
ghostpaw-grimoire review notes
ghostpaw-grimoire catalogue run --now 2026-10-28
ghostpaw-grimoire draft submit 'Release checks' --rationale 'Capture evidence' --note-ids 3 --chapter ops
ghostpaw-grimoire draft approve 1
ghostpaw-grimoire spell shelve ops/verify-release
ghostpaw-grimoire spell unshelve ops/verify-release
ghostpaw-grimoire spell move ops/verify-release ops/verify-checksum
ghostpaw-grimoire spell rollback ops/verify-release deadbeef
ghostpaw-grimoire spell repair ops/verify-release
ghostpaw-grimoire spell repair-all
ghostpaw-grimoire spell delete ops/verify-release
ghostpaw-grimoire scout adopt ./skills --chapter imported
ghostpaw-grimoire skill --list
ghostpaw-grimoire skill search-and-retrieve-spells
ghostpaw-grimoire tools
ghostpaw-grimoire describe hone_spell
```

Grimoire manages local procedural knowledge as spells, notes, and drafts. Search before creating a spell. Inspect before updating, then hone to seal revisions. Preserve provenance and use scouting only when external acquisition is intended.

## Calling tools

MCP: connect to ghostpaw-grimoire, then call a tool by name with its JSON arguments.

CLI: `ghostpaw-grimoire call <tool> '<JSON object>'` or `ghostpaw-grimoire <tool> --parameter value`.

Inspect schemas with `ghostpaw-grimoire describe <tool>`. Use `--db <path>` to select a database.

## search_grimoire

Search the grimoire for spells by name, description, and body.

Use when: When looking for spells matching a keyword, topic, or partial name.

Not for: When you already know the exact spell path — use inspect_grimoire_item instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| query | string | yes | Search query |
| chapters | array of string | no | Chapters to filter by |

Example: `ghostpaw-grimoire call search_grimoire '{"query":"post image VPS"}'`

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
| format | string | no | prompt. Index output format |

Example: `ghostpaw-grimoire call review_grimoire '{"view":"index"}'`

## inspect_grimoire_item

Inspect a single spell in detail, including tier, resonance, validation, provenance, and history.

Use when: When you need full details about a specific spell by its path.

Not for: When you want a broad overview — use review_grimoire instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| path | string | yes | Spell path |

Example: `ghostpaw-grimoire call inspect_grimoire_item '{"path":"ops/verify-release"}'`

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
| verbose | boolean | no | Include the full spell in the result. |
| force | boolean | no | Replace an existing spell at the same path. Default false. |

Example: `ghostpaw-grimoire call inscribe_spell '{"name":"verify-release","content":"---\nname: verify-release\ndescription: Verify release checksums\n---\nCheck SHA256SUMS before installing.\n"}'`

## update_spell

Write new content to an existing spell, leaving the change uncommitted.

Use when: When incorporating note evidence or improvements into an existing spell body. Follow with hone_spell to seal and advance rank.

Not for: When creating a brand-new spell — use inscribe_spell instead. When you only want to checkpoint existing edits — use hone_spell directly.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| path | string | yes | Spell path |
| verbose | boolean | no | Include the full spell in the result. |
| content | string | yes | Full spec-compliant SKILL.md content |

Example: `ghostpaw-grimoire call update_spell '{"path":"ops/verify-release","content":"---\nname: verify-release\ndescription: Verify release checksums\n---\nCheck SHA256SUMS and retry if the digest differs.\n"}'`

## hone_spell

Seal pending spell changes into a git commit, advancing spell ranks.

Use when: After editing spell content with update_spell, to checkpoint changes and evolve spell tiers. Pass note_ids to mark which notes were absorbed during this honing session.

Not for: When there are no spell changes or absorbed notes to record.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| paths | array of string | no | Spell paths to seal |
| verbose | boolean | no | Include full spells in the result. |
| message | string | no | Commit message |
| note_ids | array of integer | no | Note IDs to distill after sealing |
| noteIds | array of integer | no | Alias of note_ids |

Example: `ghostpaw-grimoire call hone_spell '{}'`

## manage_spell

Manage spells: shelve, unshelve, move, delete, repair, repair all, or rollback to a previous seal.

Use when: When you need to reorganize, archive, restore, move, remove, fix, or revert spells.

Not for: When creating new spells — use inscribe_spell. When sealing changes — use hone_spell.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | shelve, unshelve, move, delete, repair, repair_all, rollback. The management action to perform: shelve, unshelve, move, delete, repair, repair_all, or rollback. |
| verbose | boolean | no | Include the full spell when available. |
| force | boolean | no | Replace an existing spell at the same path. Default false. |
| path | string | no | Spell path — required for all actions except repair_all. |
| target | string | no | Target path — required for move. |
| ref | string | no | Git commit hash to revert to — required for rollback. Use inspect_grimoire_item to find seal hashes from history. |

Example: `ghostpaw-grimoire call manage_spell '{"action":"repair_all"}'`

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

Example: `ghostpaw-grimoire call drop_note '{"content":"Verify the build before release.","source":"practice"}'`

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
| noteIds | array of integer | no | Note IDs backing this draft — required for submit. |
| note_ids | array of integer | no | Alias of noteIds |
| chapter | string | no | Chapter for the potential spell — required for submit. |
| draftId | integer | no | Draft ID — required for approve and dismiss. |

Example: `ghostpaw-grimoire call manage_draft '{"action":"submit","title":"Release checks","rationale":"Capture checksum verification","chapter":"ops","noteIds":[1]}'`

## run_catalogue

Run the full catalogue maintenance pass — detect stale/dormant/oversized spells, route notes, cluster orphans, compute honing pressure.

Use when: Periodically or after dropping many notes to process and analyze grimoire health.

Not for: When just reading health data — use review_grimoire with view "health" instead.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| now | integer | no | Timestamp override (ms) |

Example: `ghostpaw-grimoire call run_catalogue '{}'`

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

Example: `ghostpaw-grimoire call scout_skills '{"action":"search","query":"pdf"}'`

## Workflow guides

- `ghostpaw-grimoire skill search-and-retrieve-spells`: Find relevant spells by query, then inspect candidates without scanning the entire grimoire.
- `ghostpaw-grimoire skill inscribe-spells-correctly`: Create new spells with correct structure, always searching first to avoid duplicates.
- `ghostpaw-grimoire skill evolve-spell-through-tiers`: Guide a spell through tier progression by meeting structural requirements at each gate.
- `ghostpaw-grimoire skill hone-spell-from-evidence`: The complete evidence-backed refinement flow: check readiness, gather notes, edit, seal, and distill consumed notes.
- `ghostpaw-grimoire skill maintain-grimoire-health`: Run systematic health maintenance: catalogue, review, remediate stale/dormant/oversized spells.
- `ghostpaw-grimoire skill distill-notes-into-spells`: Process accumulated notes into new spells via the draft pipeline.
- `ghostpaw-grimoire skill scout-and-adopt-skills`: Discover external skills from the ecosystem, evaluate candidates, adopt them into the grimoire with provenance.
- `ghostpaw-grimoire skill reconcile-upstream-updates`: Check for upstream changes on adopted spells and decide whether to auto-apply, manually reconcile, or keep local evolution.
- `ghostpaw-grimoire skill reorganize-spell-chapters`: Restructure chapter layout by moving, shelving, and unshelving spells to achieve balanced organization.
- `ghostpaw-grimoire skill resolve-validation-failures`: Systematically diagnose and fix structural validation failures across the grimoire.
- `ghostpaw-grimoire skill archive-and-prune-spells`: Identify dead weight and retire it using the correct archival action.
- `ghostpaw-grimoire skill decompose-oversized-spells`: Split an oversized spell into focused modules, migrating content while preserving knowledge.
- `ghostpaw-grimoire skill handle-edge-cases-gracefully`: Diagnose unexpected states by reading before mutating, following tool error recovery hints, and refusing to guess.

## Principles

- Search before writing. Preserve provenance. Seal changes after review.

## Without the binary

For npm-based environments (Node 24+), run tools with `npx -y @ghostpaw/grimoire ...`.

Harnesses embedding it in code can import `@ghostpaw/grimoire` as a library.
