# @ghostpaw/grimoire

[![npm](https://img.shields.io/npm/v/@ghostpaw/grimoire)](https://www.npmjs.com/package/@ghostpaw/grimoire)
[![node](https://img.shields.io/node/v/@ghostpaw/grimoire)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@ghostpaw/grimoire)](LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Live Demo](https://img.shields.io/badge/demo-live-06d6a0?style=flat&logo=github)](https://ghostpawjs.github.io/grimoire)

A procedural knowledge engine for Node.js, built on Git, SQLite, and the filesystem.

Grimoire treats spells (learned procedures), evidence, versioning, and health
as one coherent model instead of separate systems. It ships as a single
prebundled blob with zero runtime dependencies, designed for two audiences at
once: human developers working directly in code, and LLM agents operating
through a structured `soul` / `tools` / `skills` runtime.

## Install

```bash
npm install @ghostpaw/grimoire
```

Requires **Node.js 24+** (uses the built-in `node:sqlite` module).

## Quick Start

```ts
import { DatabaseSync } from 'node:sqlite';
import { init, read, write } from '@ghostpaw/grimoire';

const db = new DatabaseSync(':memory:');
const root = '/path/to/my-grimoire';

// Bootstrap: filesystem + SQLite tables + bare git repo with initial commit
init(root, db);

// Inscribe a new spell (content is a spec-compliant SKILL.md string)
const { spell } = write.inscribe(root, db, {
  name: 'deploy-service',
  chapter: 'engineering',
  content: '---\nname: deploy-service\ndescription: Deploy a service to production\n---\n\n# deploy-service\n\n## Steps\n\n1. Run `npm run build`\n2. Push to registry\n3. Apply manifests\n',
});

// Drop an observation note as evidence
write.dropNote(db, {
  source: 'practice',
  content: 'Build step fails if DOCKER_REGISTRY is not exported first.',
});

// Seal the improvement into a git commit, advancing rank
write.seal({ root }, db, [`engineering/${spell.name}`], 'Fix: document required env var for build step');

// Read back the enriched spell
const detail = read.getSpell(root, 'engineering/deploy-service', db);
const chapters = read.listChapters(root);
```

## The Model

Eight concepts, strict separation of concerns:

| Concept | Purpose |
|---|---|
| **Spell** | A learned procedure stored as `SKILL.md` with YAML frontmatter and a markdown body |
| **Chapter** | A folder grouping related spells into a focused collection |
| **Seal** | A git commit marking a verified improvement — rank equals seal count |
| **Tier** | Mastery level computed from rank: Uncheckpointed → Apprentice → Journeyman → Expert → Master |
| **Note** | Raw evidence (observation, failure path, correction) awaiting distillation into a spell |
| **Resonance** | Read-time signal indicating which spells have the highest return on honing effort |
| **Draft** | A proposed new spell submitted for review before inscription |
| **Catalogue** | A health snapshot: staleness, dormancy, oversizing, velocity, and clustering |

The model means each kind of truth has its own home:

| What it looks like | What it actually is |
|---|---|
| A how-to guide or runbook | A Spell |
| Related spells grouped by domain | A Chapter |
| "This procedure is proven — preserve it" | A Seal |
| "We got burned by this edge case" | A Note |
| "This spell hasn't been touched in months" | A Catalogue health signal |
| "This spell is ready to hone next" | Resonance |

State is derived, not hand-toggled. Tier, resonance color, staleness, dormancy,
and health scores are computed from evidence and commit history at read time,
never stored as caller-written flags.

### Tier progression at a glance

Grimoire computes tier markers on every read. They advance as spells accumulate
sealed improvements:

&nbsp;

> **Inscription**
>
> | | | |
> |:---:|---|---|
> | $\color{Gray}{\textsf{◎}}$ | *deploy-service* | `uncheckpointed · no seals yet` |
> | | &darr; &ensp; seal a validated improvement | |
>
> **Honing**
>
> | | | |
> |:---:|---|---|
> | $\color{SteelBlue}{\textsf{◎}}$ | *deploy-service* | `apprentice · rank 1–4` |
> | $\color{MediumSeaGreen}{\textsf{◎}}$ | *deploy-service* | `journeyman · rank 5–14` |
> | $\color{Goldenrod}{\textsf{◎}}$ | *deploy-service* | `expert · rank 15–29` |
> | $\color{Orchid}{\textsf{◎}}$ | *deploy-service* | `master · rank 30+` |
>
> **Attention signals**
>
> | | | |
> |:---:|---|---|
> | $\color{OrangeRed}{\textsf{●}}$ | *deploy-service* | `resonance · hone now` |
> | $\color{Gray}{\textsf{●}}$ | *deploy-service* | `dormant · low return on effort` |

&nbsp;

Rank is the only experience counter. Tier boundaries gate real capabilities
(history, diff, rollback), not badges.

## Two Audiences

### Human developers

Use the `read` and `write` namespaces for direct-code access to the domain:

```ts
import { read, write } from '@ghostpaw/grimoire';

// Inscribe and evolve a spell
write.inscribe(root, db, { name: 'lint-fix', chapter: 'general', content: '---\nname: lint-fix\ndescription: Run lint with autofix\n---\n\n# lint-fix\n\nRun `npx biome check --fix .`\n' });
write.dropNote(db, { source: 'practice', content: 'Biome needs --unsafe for some rules.' });
write.seal({ root }, db, ['general/lint-fix'], 'Add note about unsafe flag');

// Read derived state
const spell = read.getSpell(root, 'general/lint-fix', db);
const resonance = read.allResonance(db);
const catalogue = read.readCatalogue(db);
```

See [HUMAN.md](docs/HUMAN.md) for the full direct-code guide with worked
examples and modeling boundaries.

### LLM agents

Use the `tools`, `skills`, and `soul` namespaces for a structured runtime
surface designed to minimize LLM cognitive load:

```ts
import { tools, skills, soul } from '@ghostpaw/grimoire';

// 10 intent-shaped tools with JSON Schema inputs and structured results
const allTools = tools.grimoireTools;
const searchTool = tools.getGrimoireToolByName('search_grimoire')!;
const result = await searchTool.handler({ root, db }, { query: 'deploy' });

// Workflow skills for common multi-step scenarios
const allSkills = skills.grimoireSkills;

// Thinking foundation for system prompts
const prompt = soul.renderGrimoireSoulPromptFoundation();
```

Every tool returns a discriminated result with `outcome: 'success' | 'no_op' |
'needs_clarification' | 'error'`, structured entities, next-step hints, and
actionable recovery signals.

See [LLM.md](docs/LLM.md) for the full AI-facing guide covering soul, tools,
and skills.

## Tools

Twelve tools shaped around operator intent, not raw storage operations:

| Tool | What it does |
|---|---|
| `search_grimoire` | Search spells by name or description |
| `review_grimoire` | Dashboard views: chapters, health, resonance, notes, drafts, validation, provenance |
| `inspect_grimoire_item` | Detailed inspection of one spell: tier, resonance, validation, provenance, history |
| `inscribe_spell` | Create a new spell in the grimoire |
| `update_spell` | Write new content to an existing spell, leaving it uncommitted for `hone_spell` |
| `hone_spell` | Seal pending changes into a git commit, advancing rank |
| `manage_spell` | Shelve, unshelve, move, delete, repair, or rollback a spell |
| `drop_note` | Drop an observation note for later cataloguing |
| `distill_note` | Mark a note as distilled into a spell after incorporating its evidence |
| `manage_draft` | Submit, approve, or dismiss proposed spells |
| `run_catalogue` | Full maintenance pass: staleness, dormancy, oversizing, note routing, health |
| `scout_skills` | Scout, search, adopt, and update spells from external sources |

Each tool exports runtime metadata, JSON Schema inputs, and structured outputs
so harnesses can wire them without parsing vague prose.

## Key Properties

- **Zero runtime dependencies.** Only `node:sqlite` (built into Node 24+) for the SQLite layer.
- **Single prebundled blob.** One ESM + one CJS entry in `dist/`. No subpath exports, no code splitting.
- **Three storage backends.** Filesystem for spell content, git for versioning and rank, SQLite for metadata. Each is optional — the package degrades gracefully without any of them.
- **Evidence-first progression.** Rank is earned by sealing validated improvements. Speculative edits do not count as experience. Tier gates real capabilities, not badges.
- **Derived health signals.** Resonance, staleness, dormancy, and health scores are computed at read time from evidence and commit history — never stored as flags.
- **Intention-shaped writes.** `inscribe`, `seal`, `hone`, `dropNote`, `distill`, `adoptSpell`: operations that say what happened, not generic CRUD.
- **Additive AI runtime.** `soul` for posture, `tools` for actions, `skills` for workflow guidance — layered over the same direct-code API.
- **Colocated tests.** Every non-type module has a colocated `.test.ts` file. The documented behavior is backed by executable coverage.

## Package Surface

```ts
import {
  init,                  // bootstrap: filesystem + SQLite setup
  initGrimoireTables,    // SQLite schema only
  read,                  // all query functions
  write,                 // all mutation functions
  tools,                 // LLM tool definitions + registry
  skills,                // LLM workflow skills + registry
  soul,                  // thinking foundation for system prompts
} from '@ghostpaw/grimoire';
```

All domain and runtime types are also available at the root for TypeScript
consumers:

```ts
import type {
  GrimoireDb,
  GrimoireToolDefinition,
  GrimoireSkill,
  GrimoireSoul,
  GrimoireErrorCode,
} from '@ghostpaw/grimoire';
```

## Documentation

| Document | Audience |
|---|---|
| [HUMAN.md](docs/HUMAN.md) | Human developers using the low-level `read` / `write` API |
| [LLM.md](docs/LLM.md) | Agent builders wiring `soul`, `tools`, and `skills` into LLM systems |
| [docs/README.md](docs/README.md) | Architecture overview: model, storage topology, and source layout |
| [docs/entities/](docs/entities/) | Per-concept manuals: spells, notes, events, health, drafts, provenance, registry |

## Development

```bash
npm install
npm test            # node:test runner
npm run typecheck   # tsc --noEmit
npm run lint        # biome check
npm run build       # ESM + CJS + declarations via tsup
npm run demo:serve  # build and serve the browser demo
```

The repo is pinned to **Node 24.14.0** via `.nvmrc` / `.node-version` /
`.tool-versions` / `mise.toml` / Volta. Use whichever version manager you
prefer.

### Support

If this package helps your project, consider sponsoring its maintenance:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

---

**[Anonyfox](https://anonyfox.com) • [MIT License](LICENSE)**
