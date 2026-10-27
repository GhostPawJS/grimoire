# Grimoire

`@ghostpaw/grimoire` manages procedural knowledge with Git, SQLite, and a tool facade.

## Use

Install with `npm install @ghostpaw/grimoire` in a consuming project (Node 24).

```ts
import { DatabaseSync } from 'node:sqlite';
import { initGrimoireTables, write, read } from '@ghostpaw/grimoire';

const db = new DatabaseSync(':memory:');
initGrimoireTables(db);
write.dropNote(db, { source: 'practice', content: 'Verify the build before release.' });
const notes = read.pendingNotes(db);
db.close();
```

Callers supply the database; the library does not open file databases.
For file-backed SQLite connections, configure `PRAGMA journal_mode=WAL` and
`PRAGMA busy_timeout=5000` before passing the connection to Grimoire.

Tool definitions live in `src/tools/` and are exported through `tools` at the
package root. Use `tools.getGrimoireToolByName(name)` or `tools.grimoireTools`.
Call `tool.handler({ root, db }, input)`; some handlers return promises.
Results contain `ok`, `outcome`, `summary`, and `entities`, with optional
`warnings` and `next`. Success includes `data`; failures include `error` or
`clarification`. `tools.updateSpellTool` writes existing spell content;
`hone_spell` seals it. Write results are compact; `verbose: true` includes full spells.

`scout_skills` is the tool that can touch the network: search, remote adoption,
update checks, and applying remote updates. Local sources can remain offline.
Other tools operate on the local filesystem, Git, or the supplied database.
Git defaults to `<ROOT>/.grimoire-git`; CLI/MCP accept `GHOSTPAW_GRIMOIRE_GIT_DIR`.
The CLI also accepts `--git-dir`, which takes precedence over the environment.
The `network`, `scouting`, and `registry` namespaces also expose network APIs.

## Layout

- `src/spells/`, `src/git/`, `src/spec/`: spell files, revision history, validation.
- `src/notes/`, `src/drafts/`, `src/events/`, `src/provenance/`: SQLite state.
- `src/catalogue/`, `src/health/`, `src/indexing/`: health and discovery.
- `src/scouting/`, `src/registry/`: external acquisition and search.
- `src/tools/`, `src/skills/`: tool facade and procedural guides.
- `src/lib/`: shared utilities and test helpers; `src/demo/`: browser demo.
- `docs/`: usage and entity documentation; `dist/`: generated package output.

## Contribute

Use Node 24. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
Run `npm run check` as the full contribution gate. `npm run check:deps` verifies zero runtime
dependencies. Keep runtime dependencies at zero.

Tests use `node:test` and `node:assert/strict` in adjacent `*.test.ts` files.
Use existing helpers for isolated spell roots and in-memory databases.
Assert observable behavior; use injected fakes for network calls.
Do not weaken assertions, skip tests, or exclude code from coverage.

Changes must be non-breaking and additive. Preserve exported names, signatures,
synchronous behavior, tool names and input fields, CLI flags, and database schema.
Record changes under `Unreleased` in `CHANGELOG.md`.

Maintainers release with `npm run release:patch` or `npm run release:minor`;
these update the version, create a tag, and push it. Tag-triggered CI verifies
and publishes to npm with provenance. Leave review changes uncommitted.

Surface bindings live in `src/surface/`; reusable transports live in `src/surfaces/`.
Run `npm run surfaces` to regenerate SKILL.md, skills/, and directory manifests.
Guard budgets and API snapshots live in budgets.json and api-surface.json.
Ratchet approvals use [budget-increase-approved], [api-change-approved], and
[guardrails-change-approved] in the change description when justified.
