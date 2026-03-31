# `health`

## What It Is

A health snapshot is a computed maintenance report stored in SQLite. It
captures the grimoire's overall state at a point in time: spell counts, rank
distribution, stale/dormant/oversized lists, note routing results, orphan
clusters, seal velocity, health scores, and chapter balance.

## Why It Exists

The consumer needs a single maintenance entry point that does everything
mechanical in one pass. Catalogue is that entry point — zero LLM tokens,
sub-100ms.

## How To Use It

1. `read.catalogueReadiness(db)` — check if there is new work since the last run
2. `write.catalogue(root, db)` — compute and store a health snapshot
3. `read.readCatalogue(db)` — retrieve the latest snapshot

The typical call pattern is:

```ts
const { ready, reason } = read.catalogueReadiness(db);
if (ready) {
  write.catalogue(root, db);
}
```

`catalogueReadiness` is the readiness gate. It returns `ready: false` when
nothing has changed since the last catalogue run, preventing redundant passes.
Call catalogue on startup, on a schedule, or on demand — but gate it on
readiness to avoid repeated runs against an idle grimoire.

## Persistence Semantics

Every `catalogue()` call inserts a new row into `grimoire_health` — it does
not overwrite the previous snapshot. This is intentional: each row is an
audit point. `read.readCatalogue(db)` always returns the most recent row.

Use `read.catalogueReadiness(db)` to avoid running catalogue against an idle
grimoire; the readiness check is a pure read that never inserts rows.

## What Catalogue Computes

- **Total spells** per chapter and overall
- **Rank distribution** (JSON: `{"Apprentice": 3, "Journeyman": 2, …}`)
- **Stale spells** — sealed 90+ days ago but still being read
- **Dormant spells** — not read in 60+ days
- **Oversized spells** — approaching the line limit
- **Note routing** — auto-routes unrouted notes by trigram Jaccard
- **Orphan clustering** — clusters unrouted notes by similarity; surfaces
  draft candidates
- **Seal velocity** — per-spell trend: `recentSeals - previousSeals` (30-day
  windows)
- **Spell health score** — composite 0–1:
  `(1 - staleness) × (1 - oversizeRatio) × resonanceWeight`
- **Chapter balance** — pending notes per spell ratio; flags overloaded
  chapters

## Configurable Knobs

| Knob | Default | Controls |
|------|---------|----------|
| `staleDays` | 90 | Sealed N+ days ago while still read = stale |
| `dormantDays` | 60 | No reads in N+ days = dormant |
| `oversizeLines` | 500 | Line count warning threshold |
| `routingThreshold` | 0.3 | Trigram Jaccard minimum for auto-routing |
| `clusteringThreshold` | 0.4 | Trigram Jaccard minimum for orphan clustering |

## Related Concepts

- `spells`: health computes per-spell scores
- `notes`: catalogue routes notes and clusters orphans
- `events`: health uses event data for velocity and resonance
- `drafts`: orphan clusters surface as draft candidates

## Public APIs

### Writes

- `write.catalogue(root, db)`

### Reads

- `read.catalogueReadiness(db)` — readiness gate: new notes, new events, or no prior run
- `read.readCatalogue(db)` — latest snapshot
