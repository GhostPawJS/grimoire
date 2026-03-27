# `provenance`

## What It Is

A provenance record tracks the origin of an imported spell. Locally
inscribed spells do not have provenance records — provenance exists only
for spells brought in from external sources (marketplace, GitHub repo,
local download).

## Why It Exists

When a spell is adopted from the ecosystem, the grimoire needs to know where
it came from — for update detection, attribution, and re-fetching.

## How To Use It

Provenance is created automatically by `write.adoptSpell()`. Query it via:

- `read.getProvenance(db, spellPath)` — one spell
- `read.allProvenance(db)` — all imported spells

For update workflows:

- `network.checkUpdates(root, db)` — batch check all provenance against
  upstream
- `network.applyUpdate(root, db, spellPath)` — fetch and apply or surface
  reconciliation

## Dual Storage

Provenance lives in two places:

- **SQLite** — authority for programmatic queries and batch operations
- **Frontmatter metadata** — portable provenance that travels with the file

On import, origin info is written into the `metadata` frontmatter field so
it survives file copying between grimoires.

## Fields

| Field | Type | Meaning |
|-------|------|---------|
| `spell_path` | text (PK) | Current chapter/name path |
| `source_type` | text | `agentskillhub`, `github`, or `local` |
| `source_url` | text | Full URL to the skill or repo |
| `source_repo` | text | `owner/repo` GitHub shorthand |
| `source_path` | text | Path within the source repo |
| `source_commit` | text | Commit SHA at import time |
| `source_version` | text | Version string if available |
| `imported_at` | text | ISO timestamp of initial import |
| `updated_at` | text | ISO timestamp of last update apply |

## Lifecycle

- **Created** on `write.adoptSpell()` — the import operation
- **Updated** on `network.applyUpdate()` — commit, version, and timestamp
  change
- **Moved** on `write.moveSpell()` — `spell_path` follows the spell
- **Deleted** on `write.deleteSpell()` — provenance record removed
- **Shelved** on `write.shelve()` — preserved; updated on `unshelve()`

## Related Concepts

- `spells`: provenance tracks imported spells
- `registry`: marketplace cache that discovery searches against

## Public APIs

### Reads

- `read.getProvenance(db, spellPath)`
- `read.allProvenance(db)`
