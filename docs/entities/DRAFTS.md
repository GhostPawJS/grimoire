# `drafts`

## What It Is

A draft is a proposed new spell, queued for consumer approval. The engine
stores and retrieves drafts. The consumer submits them — whether from LLM
analysis, human observation, scripted rules, or by reviewing orphan clusters
from `catalogue()`.

## Why It Exists

The engine does not auto-create spells because generating a meaningful title
and rationale requires judgment. Drafts let the consumer capture intent
without committing to inscription. Approved drafts become inscriptions.
Dismissed drafts are archived.

## How To Use It

1. `write.submitDraft(db, input)` — queue a proposal
2. `read.pendingDrafts(db)` — review the queue
3. `write.approveDraft(db, id)` — mark approved
4. `write.dismissDraft(db, id)` — mark dismissed
5. Approved drafts become `write.inscribe()` calls (consumer-driven)

## Fields

| Field | Type | Meaning |
|-------|------|---------|
| `title` | text | Proposed spell name |
| `rationale` | text | Why this spell should exist |
| `noteIds` | id[] | Which notes support the proposal |
| `chapter` | text | Suggested chapter |
| `status` | enum | `pending`, `approved`, `dismissed` |

## Good Uses

- capturing orphan cluster suggestions from catalogue
- recording human observations that a spell is needed
- LLM-generated proposals for consumer review

## Do Not Use It For

- bypassing the inscription gate — drafts are proposals, not shortcuts

## Related Concepts

- `notes`: orphan clusters from catalogue surface as draft candidates
- `spells`: approved drafts become inscribed spells
- `health`: catalogue surfaces orphan clusters

## Public APIs

### Writes

- `write.submitDraft(db, input)`
- `write.approveDraft(db, id)`
- `write.dismissDraft(db, id)`

### Reads

- `read.pendingDrafts(db)`
