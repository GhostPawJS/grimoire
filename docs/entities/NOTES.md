# `notes`

## What It Is

A note is one raw observation from any source, stashed in SQLite during
normal operation. Notes are not spells. They are ore — unrefined signals
that accumulate silently and get distilled into spells during honing, or
surface as draft proposals.

## Why It Exists

Most observations ARE refinements of what already exists. Notes implement the
explore-exploit tradeoff: accumulating notes is exploration, honing is
exploitation. Evidence accumulates at near-zero cost before any spell is
modified.

## How To Use It

1. `write.dropNote(db, input)` — deposit an observation
2. `write.dropNotes(db, inputs)` — batch deposit
3. `write.catalogue(root, db)` — auto-routes unrouted notes by trigram
   Jaccard
4. `read.pendingNotes(db, { domain: path })` — gather evidence for honing
5. `write.distill(db, noteId, spellPath)` — mark consumed after honing
6. `write.expireNotes(db, days?)` — expire old pending notes
7. `write.enforceNoteCap(db, cap?)` — enforce the soft cap

## Good Uses

- behavioral observations from sessions
- corrections that reveal a gap
- user preferences worth encoding
- workflow patterns noticed across sessions
- evidence from failed attempts

## Do Not Use It For

- complete procedures (inscribe a spell instead)
- beliefs or factual knowledge (use codex)
- tasks or commitments (use questlog)

## Status Lifecycle

- `pending` — waiting to be distilled or to expire
- `distilled` — absorbed into a specific spell; `distilledBy` records which
- `expired` — aged out by time or cap enforcement

## Fields

| Field | Type | Meaning |
|-------|------|---------|
| `content` | text | 1–5 sentence observation |
| `source` | text | Open string origin (quest, session, coordinator…) |
| `sourceId` | text or null | Reference to source entity |
| `domain` | text or null | Optional spell-path hint for routing |
| `status` | enum | `pending`, `distilled`, `expired` |
| `distilledBy` | text or null | Spell path that absorbed this note |

## Limits

- `noteCap` (default: 50) — soft cap on pending notes
- `noteExpiryDays` (default: 90) — expiration for pending notes

## Auto-Routing

During `catalogue()`, unrouted pending notes (no domain) are matched by
trigram Jaccard against spell descriptions. Notes scoring above
`routingThreshold` (default: 0.3) get their domain auto-set. Notes below
the threshold stay unrouted.

## Orphan Clustering

After routing, remaining unrouted notes are clustered by content similarity
(single-linkage at `clusteringThreshold`, default: 0.4 Jaccard). Clusters
with 3+ members from 2+ sources are surfaced as draft candidates.

## Related Concepts

- `spells`: notes distill into spells during honing
- `health`: catalogue routes notes and surfaces orphan clusters
- `drafts`: orphan clusters can become draft proposals

## Public APIs

### Writes

- `write.dropNote(db, input)`
- `write.dropNotes(db, inputs)`
- `write.distill(db, noteId, spellPath)`
- `write.expireNotes(db, days?)`
- `write.enforceNoteCap(db, cap?)`

### Reads

- `read.listNotes(db, options?)`
- `read.pendingNotes(db, options?)`
- `read.pendingNoteCount(db)`
- `read.noteCounts(db)`
