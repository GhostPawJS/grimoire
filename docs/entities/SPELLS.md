# `spells`

## What It Is

A spell is one learned procedure plus the minimum metadata needed to
discover, validate, version, and evolve it.

On disk, a spell is a directory under a chapter containing `SKILL.md` (YAML
frontmatter + markdown body) and optional companion files (`scripts/`,
`references/`, `assets/`). The directory name is the spell's kebab-case
identifier.

## Why It Exists

Grimoire is not a documentation generator or a configuration manager. It
needs one entity that answers: what is this procedure, how do you follow it,
and how has it evolved through practice.

## How To Use It

Spells flow through the lifecycle:

1. `write.inscribe()` — create and auto-seal to Apprentice (rank 1)
2. `write.updateSpell()` — write new SKILL.md content, leaving it uncommitted
3. `write.seal()` — commit changes and advance rank
4. `read.renderContent()` — tier-aware read for prompt injection
5. `write.shelve()` / `write.unshelve()` — archive and restore
6. `write.moveSpell()` — transfer between chapters (resets rank)
7. `write.deleteSpell()` — permanent removal

## Good Uses

- deployment workflows
- coding patterns and standards
- testing procedures
- operational runbooks
- tool-specific recipes (MCP servers, APIs)
- craft techniques

## Do Not Use It For

- beliefs and factual knowledge (use codex)
- tasks and commitments (use questlog)
- relationships (use affinity)
- raw observations (use notes — they distill into spells)

## Frontmatter

| Field | Required | Meaning |
|-------|----------|---------|
| `name` | yes | Must match directory name, kebab-case |
| `description` | yes | Short summary for index |
| `license` | no | Optional license identifier |
| `compatibility` | no | Compatibility notes (max 500 chars) |
| `allowedTools` | no | Space-delimited tool names (activates at Expert) |
| `disableModelInvocation` | no | Prevent LLM from following this spell |
| `metadata` | no | Arbitrary key-value pairs |

On disk: hyphenated field names (`allowed-tools`, `disable-model-invocation`).
In API: camelCase. The parser normalizes bidirectionally.

## Rank and Tiers

| Rank | Tier | What changes |
|------|------|-------------|
| 0 | Uncheckpointed | Invisible — not in the index |
| 1–2 | Apprentice | Visible and usable |
| 3–5 | Journeyman | Composable as a dependency |
| 6–9 | Expert | `allowedTools` restrictions activate |
| 10+ | Master | Compiled summary for token-efficient reads |

Tier requirements at boundaries are structural checks (regex on headings):

- Journeyman (3+): must include failure/recovery paths
- Expert (6+): must include edge cases and caveats
- Master (10+): must include a compiled execution summary

## Chapters

A chapter is a directory under the root. All spells must live in a chapter.
Chapters are discovered, not declared. Default chapter: `general`.

## Related Concepts

- `notes`: raw evidence that gets distilled into spells during honing
- `events`: lifecycle tracking that drives resonance computation
- `provenance`: origin records for imported spells
- `health`: catalogue snapshots with stale/dormant/oversized detection

## Public APIs

### Writes

- `write.inscribe(root, db?, input)`
- `write.updateSpell(root, path, content)` — write new SKILL.md, leave uncommitted for `write.seal`
- `write.deleteSpell(root, path, db?)`
- `write.shelve(root, path, db?)`
- `write.unshelve(root, path, db?)`
- `write.moveSpell(root, from, to, db?)`
- `write.seal({ root, gitDir? }, db?, paths?, message?)`
- `write.rollback(root, path, ref)`
- `write.repair(root, path)`
- `write.repairAll(root)`
- `write.adoptSpell(root, db?, localPath, options?)`
- `write.adoptSpells(root, db?, localPaths[], options?)`

### Reads

- `read.listChapters(root)`
- `read.listSpells(root, options?)`
- `read.getSpell(root, path, db?)`
- `read.getContent(root, path, db?)`
- `read.renderContent(root, path, db?)`
- `read.buildIndex(root, options?)`
- `read.formatIndex(entries)`
- `read.rank(root, path)`
- `read.allRanks(root)`
- `read.tier(rank)`
- `read.tierInfo(rank)`
- `read.diff(root, path)`
- `read.history(root, path?)`
- `read.pendingChanges(root, path?)`
- `read.isGitAvailable()`
- `read.validate(root, path)`
- `read.validateAll(root)`
- `read.checkTierRequirements(root, path, rank)`
- `read.validateSkillMd(content)`
- `read.parseSkillMd(content)`
- `read.serializeSkillMd(frontmatter, body)`
- `read.countBodyLines(content)`
