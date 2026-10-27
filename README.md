<a href="https://grimoire.ghostpaw.dev/"><img src="https://raw.githubusercontent.com/GhostPawJS/grimoire/main/.github/social-preview.png" alt="GhostPaw grimoire: Your agent edits its SKILL.md. Who keeps the history?" width="100%"></a>

# @ghostpaw/grimoire

[![npm](https://img.shields.io/npm/v/@ghostpaw/grimoire?style=flat-square&labelColor=0a1119&color=62e6f2&label=npm)](https://www.npmjs.com/package/@ghostpaw/grimoire) [![CI](https://img.shields.io/github/actions/workflow/status/GhostPawJS/grimoire/ci.yml?branch=main&style=flat-square&labelColor=0a1119&label=CI)](https://github.com/GhostPawJS/grimoire/actions/workflows/ci.yml) [![site](https://img.shields.io/badge/site-grimoire.ghostpaw.dev-62e6f2?style=flat-square&labelColor=0a1119)](https://grimoire.ghostpaw.dev/) [![runtime deps](https://img.shields.io/badge/runtime_deps-0-7af0b4?style=flat-square&labelColor=0a1119)](package.json) [![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.GhostPawJS%2Fgrimoire-b39dff?style=flat-square&labelColor=0a1119)](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.GhostPawJS%2Fgrimoire/versions/latest) [![node](https://img.shields.io/badge/node-%E2%89%A524-93a5b9?style=flat-square&labelColor=0a1119)](https://nodejs.org) [![license](https://img.shields.io/npm/l/@ghostpaw/grimoire?style=flat-square&labelColor=0a1119&color=93a5b9)](LICENSE)

**Agent skills as SKILL.md folders, every improvement sealed as a git commit you can roll back.**

```bash
npm install @ghostpaw/grimoire
```

A procedural knowledge engine for Node.js, built on Git, SQLite, and the filesystem.

Grimoire treats spells (learned procedures), evidence, versioning, and health
as one coherent model instead of separate systems. It ships as a single
prebundled blob with zero runtime dependencies, designed for two audiences at
once: human developers working directly in code, and LLM agents operating
through a structured `soul` / `tools` / `skills` runtime.

## MCP server

```sh
claude mcp add ghostpaw-grimoire -- npx -y @ghostpaw/grimoire mcp
/plugin marketplace add GhostPawJS/grimoire
/plugin install ghostpaw-grimoire@ghostpaw-grimoire
```

Codex CLI (`~/.codex/config.toml`):

```toml
[mcp_servers.ghostpaw-grimoire]
command = "npx"
args = ["-y", "@ghostpaw/grimoire", "mcp"]
```

Cursor, Claude Desktop, or a project `.mcp.json`:

```json
{"mcpServers":{"ghostpaw-grimoire":{"command":"npx","args":["-y","@ghostpaw/grimoire","mcp"]}}}
```

Download `server.mcpb` from [releases](https://github.com/GhostPawJS/grimoire/releases) for clients supporting MCP Bundles. Build the supplied Dockerfile with `docker build -t ghostpaw-grimoire .` and mount `/data` for persistence.

Supports MCP 2026-07-28 and initialize-based protocol versions (2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05). The database defaults to `~/.ghostpaw/grimoire.db`; `--db` overrides `GHOSTPAW_GRIMOIRE_DB`. Spells default to `~/.ghostpaw/grimoire/`; set `GHOSTPAW_GRIMOIRE_ROOT` to choose another directory. No credentials are required for local tools.

## Install

The [npm package](https://www.npmjs.com/package/@ghostpaw/grimoire) requires Node 24+:

```sh
npm install @ghostpaw/grimoire      # library, uses the built-in node:sqlite module
npm install -g @ghostpaw/grimoire
npx -y @ghostpaw/grimoire --help
```

Standalone binaries are available from [GitHub Releases](https://github.com/GhostPawJS/grimoire/releases)
for linux-x64, linux-arm64, darwin-arm64, darwin-x64 and windows-x64.

```sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/grimoire/main/install.sh | sh
```

```powershell
irm https://raw.githubusercontent.com/GhostPawJS/grimoire/main/install.ps1 | iex
```

Other release installers:

```sh
mise use -g github:GhostPawJS/grimoire
ubi --project GhostPawJS/grimoire --exe ghostpaw-grimoire --in ~/.local/bin
eget GhostPawJS/grimoire
```

For [aqua](https://aquaproj.github.io/docs/reference/registry-config/), define a
`github_release` package in `aqua.yaml`:

```yaml
registries:
  - name: grimoire
    type: local
    path: grimoire-registry.yaml
packages:
  - name: GhostPawJS/grimoire@v0.4.0
    registry: grimoire
```

`grimoire-registry.yaml`:

```yaml
packages:
  - type: github_release
    repo_owner: GhostPawJS
    repo_name: grimoire
    asset: ghostpaw-grimoire-{{trimV .Version}}-{{.OS}}-{{.Arch}}.tar.gz
    format: tar.gz
    replacements: { amd64: x64 }
    overrides:
      - goos: windows
        asset: ghostpaw-grimoire-{{trimV .Version}}-windows-{{.Arch}}.zip
        format: zip
    files:
      - name: ghostpaw-grimoire
```

Install scripts verify SHA256SUMS. To verify a downloaded archive's
[build attestation](https://cli.github.com/manual/gh_attestation_verify):

```sh
gh attestation verify <archive> -R GhostPawJS/grimoire
```

Set `GHOSTPAW_VERIFY=attestation` for attestation verification in `install.sh`.
Binaries are unsigned; macOS binaries carry an ad-hoc signature. For a browser
download on macOS, remove quarantine with
`xattr -d com.apple.quarantine /path/to/ghostpaw-grimoire`.
Linux binaries require glibc 2.28+; use npx on Alpine.
See the [binary build workflow](.github/workflows/release-binaries.yml).

<!-- sizes -->

The install check runs on ubuntu-24.04, macos-15 and windows-2025.

## CLI

```text
ghostpaw-grimoire search <query>
ghostpaw-grimoire review <chapters|health|resonance|notes|drafts|validation|provenance|index>
ghostpaw-grimoire inspect <path>
ghostpaw-grimoire spell inscribe <name> --content TEXT
ghostpaw-grimoire spell update|hone <path> [flags]
ghostpaw-grimoire spell shelve|unshelve|delete|repair <path>
ghostpaw-grimoire spell move <path> <target>
ghostpaw-grimoire spell rollback <path> <ref>
ghostpaw-grimoire spell repair-all
ghostpaw-grimoire note drop <content> --source SOURCE
ghostpaw-grimoire draft submit <title> --rationale TEXT --note-ids ID --chapter NAME
ghostpaw-grimoire draft approve|dismiss <draftId>
ghostpaw-grimoire catalogue run
ghostpaw-grimoire scout adopt <source>
ghostpaw-grimoire scout search <query>
ghostpaw-grimoire scout check-updates
ghostpaw-grimoire scout apply-update <path>
ghostpaw-grimoire mcp|skill|tools|describe|call|completions|version|help
```

Global flags can appear anywhere: `--db <path>`, `--json`, `--quiet`,
`--compact`, `--help`/`-h`, `--version`/`-V`/`-v`, `--no-color`.
`NO_COLOR` is accepted; output uses no terminal colors.
Noun-verb commands print the full tool result as JSON with `--json` or when
stdout is piped. Terminal output shows the summary and payload.
`--quiet` suppresses stdout. `--compact` removes JSON indentation.

Use `help spell` or `spell update --help` for schema-derived help.
Array flags repeat, object flags accept JSON or `@path`, and `-` reads JSON stdin.
Flags use kebab-case and override stdin fields. `--` ends flags.
Database selection uses `--db`, `GHOSTPAW_GRIMOIRE_DB`, then `~/.ghostpaw/grimoire.db`.
Spell files use `GHOSTPAW_GRIMOIRE_ROOT` (default `~/.ghostpaw/grimoire`).
Context initialization may run Git. Scout remote operations need network access;
local sources can stay offline.

| Exit | Noun-verb result |
|---|---|
| 0 | Success, including no_op |
| 1 | Tool error |
| 2 | Usage or schema error |
| 3 | Clarification needed or not found |
| 4 | Conflict or version mismatch |
| 70 | Internal error |

Errors go to stderr. With `--json`, usage and internal errors also print
`{ok:false,error:{code,message}}` to stdout. Tool results retain their full
shape. Legacy `tools [--json]`, `describe <tool>`, `call <tool> [JSON|-]`
and `<tool_name> --parameter value` keep their existing exit codes.
`completions bash`, `completions zsh` and `completions fish` print shell scripts.

```sh
ghostpaw-grimoire note drop "Verify the build" --source practice --db /tmp/grimoire.db --json
ghostpaw-grimoire review notes --db /tmp/grimoire.db --json
ghostpaw-grimoire spell update --help
```

Set `GHOSTPAW_GRIMOIRE_ROOT` to a temporary directory for an isolated session.

Agent Skill: see [SKILL.md](SKILL.md) or install the `skills/grimoire` directory with its references.

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

## Docs

The live demo runs the library in your browser against an in-memory SQLite database. Each view below opens a different part of it:

- [Dashboard](https://grimoire.ghostpaw.dev/docs/): overview and actions
- [Chapters](https://grimoire.ghostpaw.dev/docs/#/chapters): spells grouped by chapter
- [Inscribe](https://grimoire.ghostpaw.dev/docs/#/inscribe): write a new spell
- [Notes](https://grimoire.ghostpaw.dev/docs/#/notes): the observations inbox
- [Catalogue](https://grimoire.ghostpaw.dev/docs/#/catalogue): health analysis of every spell
- [Scout](https://grimoire.ghostpaw.dev/docs/#/scout): search and adopt spells

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
> | $\color{SteelBlue}{\textsf{◎}}$ | *deploy-service* | `apprentice · rank 1–2` |
> | $\color{MediumSeaGreen}{\textsf{◎}}$ | *deploy-service* | `journeyman · rank 3–5` |
> | $\color{Goldenrod}{\textsf{◎}}$ | *deploy-service* | `expert · rank 6–9` |
> | $\color{Orchid}{\textsf{◎}}$ | *deploy-service* | `master · rank 10+` |
>
> **Attention signals**
>
> | | | |
> |:---:|---|---|
> | $\color{OrangeRed}{\textsf{●}}$ | *deploy-service* | `resonance · hone now` |
> | $\color{Gray}{\textsf{●}}$ | *deploy-service* | `dormant · low return on effort` |

&nbsp;

Rank is the only experience counter. Each tier raises the validation bar:
from Journeyman on, a spell is expected to include failure and recovery paths;
from Expert on, edge cases; at Master, a compiled summary.

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

Eleven tools shaped around operator intent, not raw storage operations:

| Tool | What it does |
|---|---|
| `search_grimoire` | Search spells by name or description |
| `review_grimoire` | Dashboard views: chapters, health, resonance, notes, drafts, validation, provenance |
| `inspect_grimoire_item` | Detailed inspection of one spell: tier, resonance, validation, provenance, history |
| `inscribe_spell` | Create a new spell in the grimoire |
| `update_spell` | Write new content to an existing spell, leaving it uncommitted for `hone_spell` |
| `hone_spell` | Seal pending changes into a git commit, advancing rank; optionally distill absorbed notes |
| `manage_spell` | Shelve, unshelve, move, delete, repair, or rollback a spell |
| `drop_note` | Drop an observation note for later cataloguing |
| `manage_draft` | Submit, approve, or dismiss proposed spells |
| `run_catalogue` | Full maintenance pass: staleness, dormancy, oversizing, note routing, health |
| `scout_skills` | Scout, search, adopt, and update spells from external sources |

Each tool exports runtime metadata, JSON Schema inputs, and structured outputs
so harnesses can wire them without parsing vague prose.

## Key Properties

- **Zero runtime dependencies.** Only `node:sqlite` (built into Node 24+) for the SQLite layer.
- **Single prebundled blob.** One ESM + one CJS entry in `dist/`. No subpath exports, no code splitting.
- **Three storage backends.** Filesystem for spell content, git for versioning and rank, SQLite for metadata. Each is optional — the package degrades gracefully without any of them.
- **Evidence-first progression.** Rank is earned by sealing validated improvements. Speculative edits do not count as experience. Higher tiers raise what validation expects of a spell.
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
