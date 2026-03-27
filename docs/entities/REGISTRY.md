# `registry`

## What It Is

The registry is a local SQLite cache of skills discovered from marketplace
APIs. It enables instant offline searching after initial population.

## Why It Exists

Remote search requires network access and rate limits apply. A local cache
lets consumers search for skills instantly after one refresh pass. The
registry is fully optional — Grimoire works without it, and scouting works
without it (direct URLs).

## How To Use It

1. `network.refreshIndex(db, options?)` — populate from marketplace APIs
2. `read.searchIndex(db, query)` — LIKE search against name and description
3. Use `fetchUrl` from results to feed into `network.scout()` or
   `network.fetchSkills()`

Remote search (requires network):

- `network.searchSkills(query, options?)` — query marketplace APIs directly
- `network.analyzeRepo(url)` — preview skills in a repo without downloading

## Sources

- **AgentSkillHub** (primary) — public REST API, no auth required, 162K+
  skills
- **GitHub code search** (secondary) — filename:SKILL.md search, rate-limited

## Fields

| Field | Type | Meaning |
|-------|------|---------|
| `source` | text | `agentskillhub` or `github` |
| `slug` | text | Source-specific identifier |
| `name` | text | Skill name |
| `description` | text | Short summary |
| `adoption_count` | integer | Download/adoption count |
| `source_repo` | text | `owner/repo` shorthand |
| `source_path` | text | Path within repo |
| `fetch_url` | text | URL for `fetchSkills()` |
| `last_seen` | text | ISO timestamp of last refresh |

## Related Concepts

- `provenance`: after adoption, provenance tracks the import origin
- `scouting`: the acquisition pipeline that uses registry results

## Public APIs

### Network (async)

- `network.searchSkills(query, options?)`
- `network.analyzeRepo(url)`
- `network.refreshIndex(db, options?)`

### Reads

- `read.searchIndex(db, query)`
