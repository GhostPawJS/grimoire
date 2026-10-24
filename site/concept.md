# Concept: GhostPaw Grimoire

## Voices
- Agents are told to update their own skill files when they hit errors, and nobody tracks what changed. V017 V013 V009
- Skills and agent manifests have no version history; edits overwrite the last good version. V037 V038 V036
- Too many skills pile up; people ask the agent to audit and prune them. V028 V029 V030 V011
- Skills are a supply-chain risk: marketplace skills carry vulnerabilities, and a SKILL.md can tell an agent to install malware. V027 V049 V050 V051 V007
- The same skill is copied into every agent tool's folder, each with its own path. V034 V055 V054
- Evaluating whether a skill edit helped is hard; people rig tests by hand. V039 V052 V023
- SKILL.md files bloat and get slimmed back down. V035 V053 V016
- Self-improvement loops built on skills draw scepticism. V018 V022
- Skills folders sit next to SOUL.md and HEARTBEAT.md in the agent's home. V044 V048

## Buyer
A Node.js developer whose agent writes and edits SKILL.md files, or who keeps a skills folder by hand (V017 V012). They arrive from a thread about skill sprawl or skill security (V029 V049), compare against skills.sh, ClawHub, the Agent Skills spec and Letta's skill learning (P003 P005 P004 P002), and need to see that every edit is kept, that only a sealed change counts, and that a bad edit can be rolled back (V037 V038). The hesitation most likely to stop them: another skills store sounds like another marketplace (V026 V025).

## Decision path
1. Is this about my agent's SKILL.md edits? → hero names the edit nobody kept.
2. What happens on an edit? → the run: an edit is pending until sealed; sealing is a git commit and raises rank.
3. Can I go back? → the run: history and rollback to the inscribed version.
4. Does it validate files? → the run: content without frontmatter is refused.
5. Is it small? → 0 runtime dependencies, 872 tests, 46.4 KB gzip; then install and GitHub.

## Mechanism
Chosen: a replayed real run against grimoire 0.3.0 on 2026-10-24 with a fixed git date. Seven steps on the README's deploy-service spell: a malformed SKILL.md is refused, a valid one is inscribed, a practice note is dropped, the spell is edited, the edit is sealed into a commit, the note is distilled, the history is read and the spell rolled back. A state panel shows rank, tier, notes, uncommitted changes and the first step of the procedure. Speed: on screen at load; proof: real commit hashes and returned values; effort: seven presses; honesty: labelled as a replay; share value: the commit log.
Rejected: a skill marketplace grid: that is what P003 P005 P007 are, and voices fear marketplaces.
Rejected: a tier badge animation: badges would claim boundaries; the README table and the code disagree.
Rejected: a SKILL.md editor in the browser: no git, so the core claim would be faked.

## Offer
Product: @ghostpaw/grimoire, an open-source procedural knowledge engine for Node.js on git, SQLite and the filesystem
Price: free, MIT licence
Delivery: `npm install @ghostpaw/grimoire` into a Node.js 24+ project, or `npx -y @ghostpaw/grimoire mcp` as a local MCP server

## Facts
- grimoire 0.3.0 is on npm with zero runtime dependencies and requires Node.js 24+ for node:sqlite. https://www.npmjs.com/package/@ghostpaw/grimoire
- The README calls it a procedural knowledge engine for Node.js, built on Git, SQLite, and the filesystem. https://github.com/GhostPawJS/grimoire
- A spell is a SKILL.md with YAML frontmatter and a markdown body; chapters are folders. https://github.com/GhostPawJS/grimoire
- A seal is a git commit marking a verified improvement, and rank equals seal count. https://github.com/GhostPawJS/grimoire
- Notes are raw evidence awaiting distillation into a spell. https://github.com/GhostPawJS/grimoire
- Tier, resonance, staleness and health are computed at read time. https://github.com/GhostPawJS/grimoire
- Eleven tools, among them inscribe_spell, update_spell, hone_spell, manage_spell, drop_note and run_catalogue. https://github.com/GhostPawJS/grimoire
- In the recorded run, inscribe without frontmatter threw "Invalid SKILL.md content: Missing opening frontmatter delimiter (---)". https://github.com/GhostPawJS/grimoire#quick-start
- In the recorded run, inscribe produced rank 1, an edit stayed pending at rank 1, and seal created commit 26141d8 and rank 2. https://github.com/GhostPawJS/grimoire
- In the recorded run, rollback to the inscribe commit c40ce35 restored the first version as an uncommitted change and left rank at 2. https://github.com/GhostPawJS/grimoire
- 872 tests with 95.58% line, 89.21% branch and 95.40% function coverage, measured 2026-10-24. https://github.com/GhostPawJS/grimoire
- dist is 46.4 KB gzip and imports in about 9.4 ms on the maintainer box, measured 2026-10-24. https://github.com/GhostPawJS/grimoire
- Agents and skills often have no version history when edited. V037

## Axes
| Axis | Market | Voices | Chosen |
| --- | --- | --- | --- |
| Opening | "thousands of skills", "install in one command" P003 P005 P007 | edits overwrite; no version history V037 V017 | open on the SKILL.md edit nobody kept |
| Proof | install counts and stars P003 P007 | supply-chain fear; wants evaluation V049 V039 | a replayed run with real commit hashes and the refusal |
| Mechanism | registries and installers P001 P005 P012 | prompts the agent to update skills on errors V017 | edits pending until sealed; rank is seal count; rollback |
| Palette | white or dark marketplace grids P003 P007 | terminal and git users V042 V043 | near-black void, spectral cyan for sealed, wraith violet for pending edits and notes, alarm rose for refusals, ward green for distilled |
| Imagery | logos and card grids P005 P007 | the grimoire as a book of spells V046 V044 | generated line art: an open book of light with a ghost paw on the page; a commit tree |
| Tone | growth-hack lists P008 P010 | sceptical of self-improvement claims V018 V022 | plain, says what counts as an improvement |

## Sparks
- The skill the agent rewrote last night, with no way back. V017 V037
- Fifty skills nobody remembers installing. V029 V028
- A SKILL.md that tells the agent to install malware. V050 V049
- The SKILL.md slimmed from 1,899 lines. V035 V053

## Directions
1. Skill marketplace: browse and install. V054 → struck: first direction; it is the market (P003 P005).
  pushed: a grid of glowing cards; same marketplace.
2. Security scanner: scan a SKILL.md for exfiltration. V051 V007 → struck: grimoire validates format, it does not scan for intent.
  pushed: the validation refusal stays as step one, described as a format check only.
3. Sealed history: edits wait until sealed, seals are commits, rank counts them, rollback restores. V037 V038 V017 → chosen
  pushed: the state panel shows uncommitted changes in violet until the seal; the commit hash appears; rollback returns the old step list.
4. Tier ladder: Apprentice to Master as a game. V056 → struck: the README table and the code disagree on boundaries.
  pushed: the page shows only the tier the library returned.
5. Skill pruning dashboard: health and dormancy. V029 V030 → struck: needs weeks of reads to show anything.
  pushed: run_catalogue named in the explainer.
6. One folder for all agents: sync skills across tools. V034 V055 → struck: grimoire does not write to other tools' paths.
  pushed: the filesystem layout is plain folders any tool can read.
7. Eval harness: show a skill scoring better. V039 V052 → struck: grimoire does not run evals.
  pushed: none.
8. Plain README page. V020 → struck: market baseline (P004 P006).
  pushed: README one click away.

## Concept
Every SKILL.md edit is kept, and only a sealed one counts. The page centres on the README's deploy-service spell in a state panel: rank, tier, notes, uncommitted changes and the first step of its procedure. A malformed file is refused in alarm rose. The spell is inscribed at rank 1. A practice note arrives, the agent edits the spell, and the edit sits in violet as uncommitted (V017). Sealing makes a git commit and rank 2. The note is distilled. History lists both commits, and rollback brings the first version back as a pending change (V037 V038). The plain folders stay readable by any tool (V055).

## Spine
1. Hero: "Your agent edits its SKILL.md. Who keeps the history?" Subline: plain SKILL.md folders, git seals, evidence notes in SQLite; install and MCP lines; readout; open-book art. V017 V037
2. The run: deploy-service, seven replayed steps. V038 V049
3. Explainer: spell, chapter, seal, tier, note, resonance, draft, catalogue. V029 V044
4. Worry: what grimoire checks and what it does not. V049 V051
5. Numbers: 0 deps, Node 24+, 872 tests, 95.6% lines, 46.4 KB gzip, about 9.4 ms import, 11 tools.
6. Start: install, quick start, GitHub, README, live demo, home and siblings.
7. Footer: Impressum, Datenschutz.

## Palette
| Role | Color | Source |
| --- | --- | --- |
| void | #04070b | the shared GhostPaw night; skill marketplaces are grids of cards P003 P007 |
| panel | #0a1119 | the spell pane and step panes |
| rule | #1d2c3c | pane borders and the HUD grid |
| ghost | #e3edf5 | body text |
| haze | #93a5b9 | secondary text |
| spectral | #62e6f2 | sealed state, actions, measured values |
| wraith | #b39dff | pending edits and notes |
| alarm | #ff7aa6 | refused content |
| ward | #7af0b4 | distilled notes and valid files |

## Type
| Role | Family | Source |
| --- | --- | --- |
| display | Tektur, Bahnschrift, Arial Narrow, sans-serif | the shared GhostPaw HUD face |
| body | system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif | the reader's own sans |
| code | Martian Mono, Cascadia Mono, Consolas, monospace | SKILL.md content, commit hashes and calls |

## Form
Shared panes with chamfer and lit top bar. The spell pane lists rank, tier, commits, notes, uncommitted changes and the first step. Steps as an ordered list with call and result. One column on phones; desktop keeps the spell pane beside the steps. Shared 48px grid.

## Imagery
| Image | Job | Art direction | Source |
| --- | --- | --- | --- |
| hero book | protagonist | an open book drawn in cyan light, a ghost paw resting on the right page, glyph lines and one violet hex rune; no text V046 | generated |
| commit tree | explanation | a branching tree of nodes in dashed tiers, one violet tip at the top right; sealed history V037 V038 | generated |
| share card | share preview | the hero art with the headline at 1200×630 | generated art, rendered from HTML |

## Motion
Moment: one cyan scan line sweeps the hero art once on load (900 ms).
Feedback: a run step reveals its result; the refused step flashes once.
Reduced motion: no sweep or flash.

## Copy
- Use: "edit", "seal", "commit", "roll back" V037 V017
- Show SKILL.md and folder paths as code. V035
- Avoid: "thousands of skills", "skill marketplace", "self-improving" P003 P007 V018
- Avoid: "journeyman at rank 5", "master at rank 30" and other tier boundaries; show only the tier the run returned. V056
- Plain second person; say the run is a replay. V022
- Never present voices as customers. V041

## Changelog
- 2026-10-24: first concept from the 2026-10-24 research batch (60 voices, 12 peers); sealed history chosen; replay of a real grimoire 0.3.0 run. Tier boundaries left off the page because the README table (journeyman 5–14) and the code (journeyman from 3) disagree.
