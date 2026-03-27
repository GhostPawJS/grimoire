# `events`

## What It Is

An event is one lifecycle occurrence tracked in SQLite — a read, a seal, an
inscription, a shelving, or any other tracked action on a spell.

## Why It Exists

Resonance computation requires knowing when a spell was last read and how
often. Events provide the time-series data that drives the weighted
readiness signal.

## How To Use It

Events are mostly logged transparently:

- `read.getSpell(root, path, db)` — logs a `read` event when `db` is passed
- `write.seal()` — logs `seal` events
- `write.inscribe()` — logs `inscribe` events

For manual logging:

- `write.logEvent(db, spell, event, contextId?)`

For querying:

- `read.eventsSince(db, since)` — events after a timestamp

## Event Types

- `read` — spell content was accessed
- `seal` — changes were committed
- `inscribe` — spell was created
- `shelve` — spell was archived
- `unshelve` — spell was restored
- `move` — spell was transferred between chapters
- `hone` — spell was refined
- `adopt` — spell was imported from external source

## Resonance

Resonance is computed from `read` events since the last `seal` for a spell:

```text
weightedReads = sum(exp(-daysSinceRead / resonanceHalfLife))
```

| Weighted reads | Color | Meaning |
|---------------|-------|---------|
| < 1.0 | Grey | Nothing new to learn from |
| 1.0–2.9 | Green | Marginal improvement possible |
| 3.0–5.9 | Yellow | Enough evidence — honing worthwhile |
| 6.0+ | Orange | Rich evidence pool — hone now |

Default `resonanceHalfLife`: 30 days.

## Fields

| Field | Type | Meaning |
|-------|------|---------|
| `spell` | text | Spell path (chapter/name) |
| `event` | text | Event type |
| `context_id` | text or null | External reference (session, request) |
| `ts` | text | ISO timestamp |

## Related Concepts

- `spells`: events track spell lifecycle
- `health`: catalogue uses event data for velocity and resonance

## Public APIs

### Writes

- `write.logEvent(db, spell, event, contextId?)`

### Reads

- `read.resonance(db, path)`
- `read.allResonance(db)`
- `read.eventsSince(db, since)`
