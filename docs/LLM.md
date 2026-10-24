# Grimoire LLM Building Blocks

This document is for harness builders using Grimoire's additive agent-facing
runtime.

If you are a human operator using the direct package surface in ordinary code,
read [`HUMAN.md`](HUMAN.md) instead. That document covers `init`, `read`,
`write`, `network`, `types`, and `errors`. This document is only about:

- `soul`
- `tools`
- `skills`

Typical harness-facing usage:

```ts
import { skills, soul, tools } from '@ghostpaw/grimoire';
```

## Runtime Stack

Grimoire's additive runtime is intentionally layered:

1. `soul`
2. `tools`
3. `skills`

The layers work together like this:

- `soul` shapes posture and judgment
- `tools` are the executable action surface
- `skills` teach recurring workflows built from tools

## Soul

The soul is the thinking foundation.

It does not define what the model can do. It defines how the model should see
procedures, which quality boundaries it should protect, and what kind of
judgment it should apply before touching stored state.

Grimoire exports this through the root `soul` namespace:

- `soul.grimoireSoul`
- `soul.grimoireSoulEssence`
- `soul.grimoireSoulTraits`
- `soul.renderGrimoireSoulPromptFoundation()`

The runtime soul shape is:

```ts
interface GrimoireSoul {
  slug: string;
  name: string;
  description: string;
  essence: string;
  traits: readonly {
    principle: string;
    provenance: string;
  }[];
}
```

The current soul is `Librarian`, with the slug `librarian`.

Its job is to keep the grimoire's collection of earned procedures honest
enough that any consumer following them performs better than one improvising
from scratch.

The essence establishes four boundaries:

- discovered procedures compound; invented procedures cost
- the seal is the quality gate — not every edit earns one
- maintenance compounds value more than accumulation
- structure separates signal from noise — curation, discovery, acquisition

The currently exported principles are:

- seal only what was tested in practice
- a procedure that needs explaining needs rewriting
- maintain before you accumulate
- read the signal before prescribing the action
- adopt proven procedures; hone them locally

Use the soul layer for:

- system or role-prompt foundation
- reminding the model to protect procedural honesty
- reinforcing that seals carry quality weight
- priming the model to read resonance and health before acting

Do not use the soul layer as an execution surface.

## Tools

The direct library surface is intentionally explicit. That is good for
humans, but too many choices for reliable LLM selection. The `tools` facade
reconciles the public direct surface into a smaller set of intent-shaped
tools with:

- fewer top-level choices
- strict JSON-schema-compatible inputs
- explicit action and view discriminators
- structured machine-readable outcomes
- clarification paths for ambiguous input

The current `tools` namespace exports exactly these 10 tools:

- `search_grimoire` — find spells by natural-language query with trigram
  matching
- `review_grimoire` — load a maintenance surface: chapters, health,
  resonance, notes, drafts, validation, provenance, or index
- `inspect_grimoire_item` — full detail on one spell: content, frontmatter,
  tier, rank, notes, git history
- `inscribe_spell` — create a new spell with duplication guard
- `update_spell` — write revised content to an existing spell before sealing
- `hone_spell` — seal pending changes and advance rank
- `manage_spell` — shelve, unshelve, move, delete, repair, repair all, or
  rollback
- `drop_note` — deposit a raw observation
- `manage_draft` — submit, approve, or dismiss a draft spell
- `run_catalogue` — execute a full maintenance pass
- `scout_skills` — search, adopt, check updates, or apply updates from
  external sources (async)

These tools are shaped around user intent rather than raw storage operations.
Read tools (`search_grimoire`, `review_grimoire`, `inspect_grimoire_item`)
have no side effects. Write tools mutate state and document what changed.

### Tool definition shape

Each tool exports a handler function and a full metadata definition:

```ts
interface GrimoireToolDefinition<TInput, TResult> {
  name: string;
  description: string;
  whenToUse: string;
  whenNotToUse?: string;
  sideEffects: 'none' | 'writes_state';
  readOnly: boolean;
  supportsClarification: boolean;
  targetKinds: readonly ('spell' | 'note' | 'draft' | 'provenance' | 'cluster')[];
  inputDescriptions: Record<string, string>;
  outputDescription: string;
  inputSchema: JsonSchema;
  handler: (ctx: GrimoireToolContext, input: TInput) => TResult | Promise<TResult>;
}
```

The tool context carries the grimoire root, optional database, and optional
git directory:

```ts
type GrimoireToolContext = {
  root: string;
  db?: GrimoireDb;
  gitDir?: string;
};
```

The canonical registry is surfaced at the package root through `tools`:

- `tools.grimoireTools`
- `tools.listGrimoireToolDefinitions()`
- `tools.getGrimoireToolByName()`

The public API reconciliation table is exported as `tools.toolMapping`.

### Tool outcomes

Every tool returns one of four outcomes:

- `success` — the operation completed as expected
- `no_op` — the operation was valid but nothing changed
- `needs_clarification` — the input was ambiguous; missing fields are listed
- `error` — the operation failed; error kind, code, and recovery hint are
  provided

Failures are categorized explicitly:

- `protocol` — input shape or validation issue
- `domain` — business logic violation (not found, invalid state)
- `system` — unexpected runtime error

### Output conventions

All tool results follow a consistent shape:

```ts
interface ToolSuccess<TData> {
  ok: true;
  outcome: 'success' | 'no_op';
  summary: string;
  data: TData;
  entities: ToolEntityRef[];
  warnings?: ToolWarning[];
  next?: ToolNextStepHint[];
}
```

Common fields across tools:

- `summary` — one-line human-readable description of what happened
- `entities` — referenced spells, notes, drafts, or provenance records
- `warnings` — `empty_result`, `duplication_detected`, `degraded_no_db`,
  `degraded_no_git`, `oversize`, or `stale` codes
- `next` — suggested follow-up actions with tool name and suggested input

### The `manage_spell` tool

This is the most versatile tool. It consolidates seven verbs into a single
action discriminator:

| Action | What it does | Required fields |
|--------|-------------|-----------------|
| `shelve` | Archive a spell, preserve history | `path` |
| `unshelve` | Restore from archive | `path` |
| `move` | Rename or transfer between chapters | `path`, `target` |
| `delete` | Remove permanently | `path` |
| `repair` | Auto-fix one spell | `path` |
| `repair_all` | Auto-fix all spells | (none) |
| `rollback` | Revert to a previous seal | `path`, `ref` |

### The `review_grimoire` tool

Provides eight views into grimoire state:

| View | What it shows |
|------|---------------|
| `chapters` | Chapter names with spell counts |
| `health` | Latest catalogue snapshot |
| `resonance` | Honing readiness colors for all spells |
| `notes` | Pending notes by domain |
| `drafts` | Queued draft proposals |
| `validation` | Structural issues across all spells |
| `provenance` | Origin records for imported spells |
| `index` | Full spell index with tiers |

## Skills

The tool layer makes action selection smaller and clearer, but recurring
grimoire management workflows still benefit from reusable guidance.

The `skills` layer sits above `tools` and packages the main operating
patterns into prompt-ready blocks that a harness can inject into model
context or retrieve by name.

Each skill exports:

- `name` — kebab-case identifier for routing
- `description` — one-line summary for LLM pattern matching
- `content` — full markdown playbook with steps, tools, validation, and
  pitfalls

The runtime shape is:

```ts
interface GrimoireSkill {
  name: string;
  description: string;
  content: string;
}
```

Skills are not handlers. They are reusable guidance objects that teach:

- which tools to prefer
- how to sequence them
- how to validate the outcome
- which pitfalls to avoid

The canonical registry is surfaced at the package root through `skills`:

- `skills.grimoireSkills`
- `skills.listGrimoireSkills()`
- `skills.getGrimoireSkillByName()`

The current `skills` namespace exports these 13 workflow blocks:

- `search-and-retrieve-spells` — find relevant spells without scanning the
  whole grimoire
- `inscribe-spells-correctly` — create new spells with deduplication check
- `evolve-spell-through-tiers` — guide tier progression by meeting structural
  requirements
- `hone-spell-from-evidence` — evidence-backed refinement with note
  distillation
- `maintain-grimoire-health` — systematic catalogue, review, and remediation
- `distill-notes-into-spells` — process notes through the draft pipeline
- `scout-and-adopt-skills` — discover, evaluate, and adopt from the ecosystem
- `reconcile-upstream-updates` — decide whether to auto-apply, merge, or keep
  local evolution
- `reorganize-spell-chapters` — restructure chapters for balanced
  organization
- `resolve-validation-failures` — diagnose and fix structural issues
- `archive-and-prune-spells` — identify dead weight and retire it correctly
- `decompose-oversized-spells` — split large spells into focused modules
- `handle-edge-cases-gracefully` — diagnose before mutating, follow recovery
  hints

Each skill's `content` follows a consistent template:

- **Primary tools** — which tools the skill uses
- **Goal** — what the skill achieves
- **When to use** — situation triggers
- **When not to use** — anti-patterns
- **Step-by-step sequence** — how to combine the tools
- **Validation checks** — what to verify after
- **Pitfalls** — failure modes to avoid
- **Tips and tricks** — non-obvious guidance
- **Tool calls to prefer** — explicit tool recommendations
- **Related skills** — cross-references to other skills

## How The Layers Fit Together

A good Grimoire-based LLM system typically uses the layers in this order:

1. Start from the soul so the model is primed with the right procedural
   judgment.
2. Expose the tools so the model has a clean action surface.
3. Load relevant skills so common grimoire management situations do not have
   to be improvised from scratch.

That gives the system:

- a thinking posture (soul)
- an execution surface (tools)
- reusable operational playbooks (skills)
- all backed by real runtime exports instead of prose-only conventions

## Design Boundary

`soul`, `tools`, and `skills` are additive. They do not replace the direct
library surface.

Humans still get the precise direct-code API through `read`, `write`, and
`network`. Agents get a smaller, clearer runtime stack on top of the same
truthful core:

- `soul` for behavioral foundation
- `tools` for actions
- `skills` for workflow guidance

Both operate on the same underlying model. The same deterministic engine runs
underneath whether the caller is a TypeScript function call or an LLM tool
invocation.
