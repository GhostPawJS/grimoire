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

Default DB opens print "using default db <absolute path>" on stderr; suppress with -q/--quiet or GHOSTPAW_QUIET=1.
GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT=1 refuses default DB opens and bare spell hone (exit 2, no writes). Set --db or GHOSTPAW_GRIMOIRE_DB; --root/--git-dir and GHOSTPAW_GRIMOIRE_ROOT/GHOSTPAW_GRIMOIRE_GIT_DIR select spell storage separately.
Hone paths or --all (every pending edit). Bare hone warns and lists paths; bare hone will require --all in a future minor. --all with paths exits 2. --paths and --note-ids/--note_ids are accepted.
State: DB = --db / GHOSTPAW_GRIMOIRE_DB / ~/.ghostpaw/grimoire.db; root = --root / GHOSTPAW_GRIMOIRE_ROOT / <DB parent>/grimoire when GHOSTPAW_GRIMOIRE_DB names a file / ~/.ghostpaw/grimoire.
Git history lives at <ROOT>/.grimoire-git; precedence: --git-dir / GHOSTPAW_GRIMOIRE_GIT_DIR / <ROOT>/.grimoire-git. Empty env values are unset; :memory: does not select a filesystem root. --db overrides the DB file only, not the environment-derived root.
A spell is <chapter>/<name>/SKILL.md with optional scripts/, references/, and assets/. Copy the folder to export it.
Rank counts distinct commits per spell: Uncheckpointed 0, Apprentice 1–2, Journeyman 3–5, Expert 6–9, Master 10+.
Search uses multiple terms across names, descriptions, and bodies with stemming and fuzzy metadata matching.
Inscribe conflicts when the destination exists; --force replaces it. Identical content and no-change hone return no_op.
Hone accepts positional paths and --paths. Both --note-ids and --note_ids work for hone and draft submit.
Inspect shows rollback hashes in history. Updates require hone to checkpoint changes.
Spell --content accepts @file, @- for stdin and @@ for a literal leading @; every other value is literal. A final - reads JSON stdin (including spell inscribe <name> -).
--now accepts epoch milliseconds, ISO 8601 date-time, and YYYY-MM-DD. Inspect history and catalogue dates are ISO.
Write results are compact; --verbose includes full spell content. review index --format prompt returns only the formatted block in data.
Output: --json, --compact, -q, --quiet. Exit codes: 0 success/no_op, 1 tool error, 2 usage, 3 not found/clarification, 4 conflict, 70 internal error.
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

## Running inside sandboxed agent harnesses

Inside a Codex CLI `--sandbox workspace-write` session, the database and its
parent directory must be inside a writable root, including SQLite's `-wal` and
`-shm` side files. A default DB under `~/.ghostpaw` outside those roots can fail
with `SQLITE_CANTOPEN` or `EPERM` (often exit 70; directory creation failures
may exit 2), even when normal shell permissions allow access. Put the DB inside the workspace with `--db ./state/grimoire.db`,
or set `GHOSTPAW_GRIMOIRE_DB="$PWD/state/grimoire.db"` for CLI/MCP use.

To use an external DB directory, add it when starting the OpenAI Codex CLI
(replace `<dir-with-db>` with its absolute path):

```sh
codex exec --sandbox workspace-write --add-dir <dir-with-db> "Run the GhostPaw CLI"
```

Alternatively, set `sandbox_workspace_write.writable_roots` in
`~/.codex/config.toml` before starting the session:

```toml
[sandbox_workspace_write]
writable_roots = ["/absolute/dir-with-db"]
```

The spell root and Git directory must also be inside writable roots. Select
`--root ./state/spells` (or `GHOSTPAW_GRIMOIRE_ROOT`) as well as `--db`;
`--db` alone does not relocate the spell root. Git defaults to
`<root>/.grimoire-git`; keep it there or select a writable directory with
`--git-dir ./state/spell-history` / `GHOSTPAW_GRIMOIRE_GIT_DIR`. Add each
external directory with another `--add-dir` or writable_roots entry. Avoid a
protected workspace `.git` directory; use the dedicated spell history directory.


## Calling tools

MCP: connect to ghostpaw-grimoire, then call a tool by name with its JSON arguments.

CLI: `ghostpaw-grimoire call <tool> '<JSON object>'` or `ghostpaw-grimoire <tool> --parameter value`.

Inspect schemas with `ghostpaw-grimoire describe <tool>`. Use `--db <path>` to select a database.

## search_grimoire

Search spell names, descriptions, and bodies.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| query | string | yes | Search query |
| chapters | array of string | no |  |

Example: `ghostpaw-grimoire call search_grimoire '{"query":"post image VPS"}'`

## review_grimoire

Review check (resonance and saved catalogue), chapters, health, resonance, notes, drafts, validation, provenance, or index.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| strict | boolean | no | Reject invalid YAML and unknown frontmatter. |
| view | string | yes | check, chapters, health, resonance, notes, drafts, validation, provenance, index.  |
| limit | integer | no | Maximum results to return |
| now | integer | no | Timestamp override |
| format | string | no | prompt.  |

Example: `ghostpaw-grimoire call review_grimoire '{"view":"index"}'`

## inspect_grimoire_item

Inspect spell content, tier, resonance, validation, provenance, and history.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| strict | boolean | no | Reject invalid YAML and unknown frontmatter. |
| path | string | yes | Spell path |

Example: `ghostpaw-grimoire call inspect_grimoire_item '{"path":"ops/verify-release"}'`

## inscribe_spell

Create a spell from SKILL.md content (YAML frontmatter and Markdown).

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| strict | boolean | no | Reject invalid YAML and unknown frontmatter. |
| name | string | yes | Spell name |
| content | string | yes | Spell body content in markdown |
| chapter | string | no | Chapter name |
| verbose | boolean | no | Include full spell. |
| force | boolean | no | Overwrite the target spell. |

Example: `ghostpaw-grimoire call inscribe_spell '{"name":"verify-release","content":"---\nname: verify-release\ndescription: Verify release checksums\n---\nCheck SHA256SUMS before installing.\n"}'`

## update_spell

Write new content to an existing spell, leaving the change uncommitted.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| strict | boolean | no | Reject invalid YAML and unknown frontmatter. |
| path | string | yes | Spell path |
| verbose | boolean | no | Include full spell. |
| content | string | no | Full SKILL.md |
| replace | array of object | no |  |
| appendSection | object | no |  |
| appendSection.heading | string | yes | Heading |
| appendSection.body | string | yes | Markdown |

Example: `ghostpaw-grimoire call update_spell '{"path":"ops/verify-release","content":"---\nname: verify-release\ndescription: Verify release checksums\n---\nCheck SHA256SUMS and retry if the digest differs.\n"}'`

## hone_spell

Seal pending spell changes into a git commit, advancing spell ranks.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| paths | array of string | no |  |
| verbose | boolean | no | Include full spells. |
| message | string | no | Commit message |
| note_ids | array of integer | no |  |
| noteIds | array of integer | no |  |

Example: `ghostpaw-grimoire call hone_spell '{}'`

## manage_spell

Archive, restore, move, delete, repair, or roll back spells.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | shelve, unshelve, move, delete, repair, repair_all, rollback.  |
| verbose | boolean | no | Include full spell if available. |
| force | boolean | no | Overwrite the target spell. |
| path | string | no | Required except repair_all. |
| target | string | no | Required move target. |
| ref | string | no | Required rollback hash; find via inspect_grimoire_item. |

Example: `ghostpaw-grimoire call manage_spell '{"action":"repair_all"}'`

## drop_note

Record an observation for later cataloguing.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| content | string | yes | Note content |
| source | string | yes | Source identifier |
| domain | string | no | Topic domain |

Example: `ghostpaw-grimoire call drop_note '{"content":"Verify the build before release.","source":"practice"}'`

## manage_draft

Submit, approve, or dismiss spell drafts.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | submit, approve, dismiss.  |
| title | string | no | Draft title — required for submit. |
| rationale | string | no | Required submission rationale. |
| noteIds | array of integer | no |  |
| note_ids | array of integer | no |  |
| chapter | string | no | Chapter for the potential spell — required for submit. |
| draftId | integer | no | Draft ID — required for approve and dismiss. |

Example: `ghostpaw-grimoire call manage_draft '{"action":"submit","title":"Release checks","rationale":"Capture checksum verification","chapter":"ops","noteIds":[1]}'`

## run_catalogue

Maintain health, route notes, cluster orphans, and score honing pressure.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| now | integer | no | Timestamp override (ms) |

Example: `ghostpaw-grimoire call run_catalogue '{}'`

## scout_skills

Scout, search, adopt, and update spells from external sources.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| strict | boolean | no | Reject invalid YAML and unknown frontmatter during import or update. |
| action | string | yes | adopt, search, check_updates, apply_update.  |
| source | string | no | Required adopt source. |
| chapter | string | no | Adoption chapter. |
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
- `ghostpaw-grimoire skill decompose-oversized-spells`: Find better abstractions before splitting oversized spells.
- `ghostpaw-grimoire skill handle-edge-cases-gracefully`: Diagnose unexpected states by reading before mutating, following tool error recovery hints, and refusing to guess.

## Principles

- Search before writing. Preserve provenance. Seal changes after review.

## Without the binary

For npm-based environments (Node 24+), run tools with `npx -y @ghostpaw/grimoire ...`.

Harnesses embedding it in code can import `@ghostpaw/grimoire` as a library.
