# Grimoire Docs

This folder is the operator and implementer manual for Grimoire.

The source of truth for the actual schema and implementation lives in code
under `src/`. These docs describe what each concept is for, why it exists,
how it should be used, and which public APIs belong to it.

## Manuals

- [`HUMAN.md`](HUMAN.md): direct `init`, `read`, `write`, and `network`
  surfaces for human operators and developers
- [`LLM.md`](LLM.md): additive `soul`, `tools`, and `skills` runtime for
  harness builders wiring Grimoire into agents
- [`PAGES.md`](PAGES.md): browser demo app (Spell Forge)

## Entity Manuals

- [`entities/SPELLS.md`](entities/SPELLS.md): the spell atom — procedures on
  the filesystem with frontmatter, chapters, and companion files
- [`entities/NOTES.md`](entities/NOTES.md): raw observations that accumulate
  as evidence for honing
- [`entities/EVENTS.md`](entities/EVENTS.md): lifecycle event log for
  resonance computation
- [`entities/HEALTH.md`](entities/HEALTH.md): catalogue snapshots with health
  scores, velocity, and clustering
- [`entities/DRAFTS.md`](entities/DRAFTS.md): proposed new spells awaiting
  consumer approval
- [`entities/PROVENANCE.md`](entities/PROVENANCE.md): origin records for
  imported spells
- [`entities/REGISTRY.md`](entities/REGISTRY.md): local marketplace cache for
  offline skill discovery

Exact public APIs live at the bottom of each entity manual.

## Core Separations

- `spells` own procedures on the filesystem — SKILL.md content, frontmatter,
  chapters, and companion files
- `git` owns versioning — seals, rank, tier, diff, history, and rollback
- `notes` own raw evidence in SQLite — observations awaiting distillation
- `events` own lifecycle tracking in SQLite — reads and seals that drive
  resonance
- `health` owns catalogue snapshots — stale, dormant, oversized, velocity,
  and orphan clustering
- `drafts` own proposed spells — consumer-submitted suggestions awaiting
  approval
- `provenance` owns import origins — source tracking for adopted spells
- `registry` owns the local marketplace cache — offline search over discovered
  skills
- `scouting` owns acquisition — fetch, adopt, update reconciliation
- `spec` owns format compliance — SKILL.md parsing, validation, serialization
- `validation` owns structural correctness — frontmatter, naming, size
- read surfaces such as index, resonance, tier info, and catalogue are derived
  from stored state
- `tools`, `skills`, and `soul` are additive runtime layers over the same
  direct-code API

## Storage Topology

Grimoire uses three storage backends:

- **Filesystem** — source of truth for spell content (`SKILL.md` and
  companion files)
- **Git** — source of truth for versioning (rank = seal count, history,
  rollback)
- **SQLite** — supplementary metadata (events, notes, health, drafts,
  provenance, registry)

The package works without SQLite (no resonance, no notes, no cataloguing).
It works without git (no rank, no history, no rollback). Full-featured with
all three.
