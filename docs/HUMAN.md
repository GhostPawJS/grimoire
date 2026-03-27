# Grimoire — Human Usage

This document is for human operators and developers using Grimoire directly
in code.

It assumes you are working with the low-level public library surface exposed
at the package root through `init`, `read`, `write`, `network`, `types`, and
`errors`.

If you are wiring Grimoire into an agent or LLM harness, read
[`LLM.md`](LLM.md) instead. That document covers the additive `soul`,
`tools`, and `skills` runtime. This document is about humans using the
underlying library directly.

Contracts and vocabulary live in [`CONCEPT.md`](../CONCEPT.md). Exact entity
details live in the entity manuals under [`entities/`](entities/).

## Which Surface To Use

Human-facing direct usage usually looks like:

```ts
import { errors, init, read, write, network } from '@ghostpaw/grimoire';
```

Use this surface when a human is deciding what to inscribe, how to organize
chapters, when to hone, and when to scout — in application code, scripts,
CLIs, backends, or custom interfaces.

## Package Imports

| Symbol | Role |
|--------|------|
| `init` | Create tables, default chapter, and git repo |
| `read` | Query namespace (`listSpells`, `getSpell`, `buildIndex`, `resonance`, …) |
| `write` | Mutation namespace (`inscribe`, `seal`, `shelve`, `dropNote`, …) |
| `network` | Async namespace (`scout`, `fetchSkills`, `searchSkills`, `checkUpdates`, …) |
| `GrimoireDb` | Type alias for the database interface |
| `GrimoireError` | Base error class with subclasses |
| `DEFAULTS` | Configurable knobs with their default values |
| `resolveNow`, `withTransaction` | Plumbing hooks for time and transactions |

Root re-exports also surface concrete error classes without the `errors.`
prefix.

## Minimal Session

```ts
import { DatabaseSync } from 'node:sqlite';
import { init, read, write } from '@ghostpaw/grimoire';

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA journal_mode = WAL');
init('/path/to/skills', db);

// Inscribe a spell
const result = write.inscribe('/path/to/skills', db, {
  name: 'deploy-vercel',
  content: '---\nname: deploy-vercel\ndescription: Deploy to Vercel\n---\n\n# deploy-vercel\n\nSteps here.\n',
  chapter: 'engineering',
});

// List all spells
const spells = read.listSpells('/path/to/skills');

// Build a prompt index
const entries = read.buildIndex('/path/to/skills');
const index = read.formatIndex(entries);

// Check resonance
const color = read.resonance(db, 'engineering/deploy-vercel');
```

## The Human Modeling Rule

Grimoire works best when a human keeps its procedural boundaries clean:

1. One procedure per spell. Split compound workflows into focused modules.
2. Every spell must have been tested in practice before sealing. A spell
   written from speculation teaches the wrong lesson.
3. Failure paths are explicit — what happens when the step fails, not just
   when it succeeds.
4. Concrete details baked in — specific tools, paths, arguments — not generic
   instructions.
5. Target 20–50 lines of body content. Past 80, consider decomposition.

If those boundaries blur — compound procedures, untested content, missing
failure paths — every downstream surface (index, resonance, catalogue) works
against unreliable spells.

## Core Human Boundaries

### Spell vs. Note

A spell is one earned procedure with structured metadata. A note is a raw
observation — evidence that may later be distilled into a spell during
honing. If you have an observation but not yet a procedure, drop a note.
If you have a proven workflow, inscribe a spell.

### Filesystem vs. SQLite vs. Git

- **Content**: on disk as `SKILL.md` files in chapter directories
- **Metadata**: in SQLite (events, notes, health, drafts, provenance)
- **Versioning**: in git (seals, rank, tier, rollback)

Each backend is optional. Without SQLite, no resonance or notes. Without
git, no rank or history. Without both, pure content discovery and validation.

### Seal vs. Edit

Editing a spell is changing the file on disk. Sealing is committing those
changes to git and advancing the rank. Not every edit earns a seal — only
genuine improvements that make the procedure more reliable when followed.

## The Read Surface

All queries are synchronous, deterministic, and require no LLM.

### Discovery and Content

| Function | Returns |
|----------|---------|
| `read.listChapters(root)` | All discovered chapter names |
| `read.listSpells(root, options?)` | All spells, filterable by chapter(s) |
| `read.getSpell(root, path, db?)` | Full spell record with absolute paths |
| `read.getContent(root, path, db?)` | Raw SKILL.md text |
| `read.renderContent(root, path, db?)` | Tier-aware transformed content |

When `db` is passed to `getSpell`, `getContent`, or `renderContent`, a
`read` event is logged transparently for resonance tracking.

### Index

| Function | Returns |
|----------|---------|
| `read.buildIndex(root, options?)` | Structured entries, filterable by chapters |
| `read.formatIndex(entries)` | Rendered markdown for prompt injection |

### Git

| Function | Returns |
|----------|---------|
| `read.rank(root, path)` | Seal count for one spell |
| `read.allRanks(root)` | All seal counts |
| `read.tier(rank)` | Tier from rank number |
| `read.tierInfo(rank)` | Tier with `sealsToNextTier` |
| `read.pendingChanges(root, path?)` | Uncommitted modifications |
| `read.diff(root, path)` | Detailed diff since last seal |
| `read.history(root, path?)` | Git log entries |
| `read.isGitAvailable()` | Whether git is on the system |

### Lifecycle (requires SQLite)

| Function | Returns |
|----------|---------|
| `read.resonance(db, path)` | Honing readiness color for one spell |
| `read.allResonance(db)` | All honing readiness colors |
| `read.eventsSince(db, since)` | Events after timestamp |

### Validation

| Function | Returns |
|----------|---------|
| `read.validate(root, path)` | Structural check for one spell |
| `read.validateAll(root)` | All spells |
| `read.checkTierRequirements(root, path, rank)` | Missing tier requirements |
| `read.validateSkillMd(content)` | Spec validation of a SKILL.md string |
| `read.parseSkillMd(content)` | Parse frontmatter + body |
| `read.serializeSkillMd(frontmatter, body)` | Produce spec-compliant SKILL.md |
| `read.countBodyLines(content)` | Line count for oversize detection |

### Notes (requires SQLite)

| Function | Returns |
|----------|---------|
| `read.listNotes(db, options?)` | Filtered note list |
| `read.pendingNotes(db, options?)` | Pending only, filterable by domain |
| `read.pendingNoteCount(db)` | Quick count |
| `read.noteCounts(db)` | Breakdown by source and domain |

### Other Reads (require SQLite)

| Function | Returns |
|----------|---------|
| `read.readCatalogue(db)` | Latest health snapshot |
| `read.pendingDrafts(db)` | Queued spell suggestions |
| `read.getProvenance(db, spellPath)` | Origin record for one spell |
| `read.allProvenance(db)` | All provenance records |
| `read.searchIndex(db, query)` | Local registry cache search |

## The Write Surface

Every write is synchronous and returns the mutated state.

### Spells

| Function | What it does |
|----------|--------------|
| `write.inscribe(root, db?, input)` | Create a new spell, auto-seal to Apprentice |
| `write.deleteSpell(root, path, db?)` | Remove from filesystem |
| `write.shelve(root, path, db?)` | Archive to `.shelved/` — preserves history |
| `write.unshelve(root, path, db?)` | Restore from `.shelved/` |
| `write.moveSpell(root, from, to, db?)` | Rename or transfer between chapters |
| `write.seal(root, db?, paths?, message?)` | Commit changes, advance rank |
| `write.rollback(root, path, ref)` | Revert to a previous seal |
| `write.repair(root, path)` | Auto-fix structural issues |
| `write.repairAll(root)` | Auto-fix all spells |

### Adopt (from local staging)

| Function | What it does |
|----------|--------------|
| `write.adoptSpell(root, db?, localPath, options?)` | Validate, copy, seal, record provenance |
| `write.adoptSpells(root, db?, localPaths[], options?)` | Batch adopt |

### Events (requires SQLite)

| Function | What it does |
|----------|--------------|
| `write.logEvent(db, spell, event, contextId?)` | Track reads, seals, inscriptions |

### Notes (requires SQLite)

| Function | What it does |
|----------|--------------|
| `write.dropNote(db, input)` | Deposit an observation |
| `write.dropNotes(db, inputs)` | Batch deposit |
| `write.distill(db, noteId, spellPath)` | Mark consumed by a spell |
| `write.expireNotes(db, days?)` | Expire old pending notes |
| `write.enforceNoteCap(db, cap?)` | Expire oldest pending to cap |

### Catalogue (requires SQLite)

| Function | What it does |
|----------|--------------|
| `write.catalogue(root, db)` | Compute health snapshot and store it |

### Drafts (requires SQLite)

| Function | What it does |
|----------|--------------|
| `write.submitDraft(db, input)` | Queue a new spell suggestion |
| `write.approveDraft(db, id)` | Mark approved |
| `write.dismissDraft(db, id)` | Mark dismissed |

## The Network Surface

All async functions. The only functions in Grimoire that require network
access.

| Function | What it does |
|----------|--------------|
| `network.fetchSkills(source)` | Download, scan, validate external skills |
| `network.scout(root, db, source, options?)` | All-in-one: fetch + adopt + cleanup |
| `network.checkUpdates(root, db)` | Batch check provenance against upstream |
| `network.applyUpdate(root, db, spellPath)` | Fetch and apply or surface reconciliation |
| `network.searchSkills(query, options?)` | Query marketplace APIs |
| `network.analyzeRepo(url)` | Preview skills in a repo without downloading |
| `network.refreshIndex(db, options?)` | Populate local registry cache |

## Human Operating Loop

The direct-code operating loop is:

1. **Inscribe** spells from proven practice — one procedure per spell.
2. **Seal** after genuine improvements to advance rank.
3. **Drop notes** when you observe something relevant but don't yet have a
   procedure.
4. **Run catalogue** periodically to surface health, route notes, and detect
   dormancy.
5. **Hone** spells when resonance turns yellow or orange — distill notes into
   improvements.
6. **Validate** to catch structural issues; **repair** to auto-fix them.
7. **Scout** the ecosystem for proven procedures rather than reinventing.
8. **Shelve** dormant spells; **decompose** oversized ones.

## What Good Usage Looks Like

Good usage:

- one procedure per spell, tested in practice before sealing
- search before inscribing to avoid duplicates
- seal only genuine improvements, not routine edits
- process notes and catalogue regularly
- use resonance to prioritize honing effort
- keep chapters focused — one domain per chapter

Bad usage:

- compound procedures bundled into single spells
- sealing untested content to inflate rank
- ignoring notes and letting them expire
- never running catalogue
- flat chapter structure with everything in `general/`
- duplicating adopted spells instead of honing them

## Where To Go Next

- Use [`entities/`](entities/) for detailed entity descriptions.
- Use [`README.md`](README.md) for architecture overview.
- Use [`LLM.md`](LLM.md) when building a harness around `soul`, `tools`, and
  `skills`.
