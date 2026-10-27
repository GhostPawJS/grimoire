# Changelog

All notable changes are documented here using [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

- Git is invoked without a shell; spell names, chapters and paths are validated and must stay inside the root.
- Repository cloning validates URLs and refs, disables interactive prompts, and restricts external protocols. Staged symbolic links are skipped during adoption.

### Fixed

- Creating, moving, or restoring a spell into an occupied path returns a conflict and preserves existing content.

### Added

- Optional `force` for inscribe, move, and unshelve, including schema-derived `--force` flags, to replace an existing destination.
- Exported `GrimoireConflictError` with tool error code `conflict` and CLI exit status 4.

## [0.4.2] - 2026-10-27

### Fixed

- Flag values that start with dashes, such as a SKILL.md beginning with `---` front matter passed to `--content`, are no longer rejected as a missing value. Only a following `--name` token counts as the next flag.
- The catalogue summary uses singular nouns for a count of one (`1 spell`, `1 orphan cluster`).

## [0.4.1] - 2026-10-27

### Fixed

- Creating a new spell root no longer prints git's `init.defaultBranch` hints to stderr on machines where that setting is unset.

## [0.4.0] - 2026-10-27

### Added

- 22 schema-derived CLI commands: search, review, inspect; spell inscribe, update, hone, shelve, unshelve, move, delete, repair, repair-all, rollback; note drop; draft submit, approve, dismiss; catalogue run; scout adopt, search, check-updates, apply-update.
- Standalone binary builds for linux-x64, linux-arm64, darwin-arm64, darwin-x64 and windows-x64 with SHA256SUMS and build attestations. Binaries are unsigned; macOS uses ad-hoc signatures.
- Checksum-verifying install.sh and install.ps1 refuse mismatches. Release install checks run on ubuntu-24.04, macos-15 and windows-2025 using offline note commands and temporary spell roots and databases.
- Schema-derived help, bash/zsh/fish completions, JSON stdin, file values, global flags and exit codes 0/1/2/3/4/70.
- Optional additive `SurfaceTool.cli` metadata.

### Changed

- CLI and binary entry points share Grimoire context wiring. Legacy forms retain their behavior and MCP metadata stays unchanged. Spell roots use GHOSTPAW_GRIMOIRE_ROOT; initialization may run Git. Remote scouting needs network access.

## [0.3.0] - 2026-10-24

### Added

- MCP stdio server and CLI backed by the existing tool registry.
- Agent Skill documentation, directory manifests, Dockerfile, and MCP Bundle packaging.
- Size, public API, consumer, startup, and ratchet guards.

### Fixed

- Sealing works when git has no user identity configured; spells inscribed on such machines are ranked and found by search again.

## [0.2.15] - 2026-10-24

### Added

- Contributor and usage guidance, including SQLite settings and network tool scope.
- Tests for package tool exports, registry dispatch, demo health and indexing, and registry requests with fake responses.
- CI check for zero runtime dependencies.

### Fixed

- Export updateSpellTool through the package tools namespace.
- Include update_spell in the tool list in the integration guide.

## [0.2.14] - 2026-04-06

### Fixed

- Publish releases using GitHub OIDC trusted publishing and correct the release workflow configuration.

## [0.2.13] - 2026-03-31

### Changed

- Fold note distillation into hone_spell with note_ids, replacing distill_note.

## [0.2.12] - 2026-03-31

### Added

- Spell update and note distillation tools.

## [0.2.11] - 2026-03-31

### Added

- Catalogue readiness reporting through the read namespace.

## [0.2.10] - 2026-03-30

### Fixed

- Initialize Git with an empty commit to support history on new repositories.

## [0.2.9] - 2026-03-30

### Fixed

- Respect custom Git directories in spell reads, rendering, and adoption.

## [0.2.8] - 2026-03-30

### Fixed

- Capture Git error output instead of leaking it to stderr.

## [0.2.7] - 2026-03-30

### Fixed

- Respect custom Git directories when inscribing spells.

## [0.2.6] - 2026-03-30

### Fixed

- Isolate test roots from parent Git directories.

## [0.2.5] - 2026-03-30

### Fixed

- Respect custom Git directories when building indexes.

## [0.2.4] - 2026-03-30

### Added

- Content rendering context IDs for correlated resonance tracking.

## [0.2.3] - 2026-03-30

### Fixed

- Flatten discriminated tool input schemas for compatibility.

## [0.2.2] - 2026-03-30

### Fixed

- Add object types to union tool input schemas for compatibility.

## [0.2.1] - 2026-03-28

### Added

- Package README and discovery metadata.

## [0.2.0] - 2026-03-27

### Added

- Initial procedural knowledge library, tool facade, documentation, and browser demo. Early setup and demo improvements are grouped here.

[Unreleased]: https://github.com/GhostPawJS/grimoire/compare/v0.4.2...HEAD
[0.4.2]: https://github.com/GhostPawJS/grimoire/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/GhostPawJS/grimoire/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/GhostPawJS/grimoire/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/GhostPawJS/grimoire/compare/v0.2.15...v0.3.0
[0.2.15]: https://github.com/GhostPawJS/grimoire/compare/v0.2.14...v0.2.15
[0.2.1]: https://github.com/GhostPawJS/grimoire/compare/v0.2.0...v0.2.1
[0.2.2]: https://github.com/GhostPawJS/grimoire/compare/v0.2.1...v0.2.2
[0.2.3]: https://github.com/GhostPawJS/grimoire/compare/v0.2.2...v0.2.3
[0.2.4]: https://github.com/GhostPawJS/grimoire/compare/v0.2.3...v0.2.4
[0.2.5]: https://github.com/GhostPawJS/grimoire/compare/v0.2.4...v0.2.5
[0.2.6]: https://github.com/GhostPawJS/grimoire/compare/v0.2.5...v0.2.6
[0.2.7]: https://github.com/GhostPawJS/grimoire/compare/v0.2.6...v0.2.7
[0.2.8]: https://github.com/GhostPawJS/grimoire/compare/v0.2.7...v0.2.8
[0.2.9]: https://github.com/GhostPawJS/grimoire/compare/v0.2.8...v0.2.9
[0.2.10]: https://github.com/GhostPawJS/grimoire/compare/v0.2.9...v0.2.10
[0.2.11]: https://github.com/GhostPawJS/grimoire/compare/v0.2.10...v0.2.11
[0.2.12]: https://github.com/GhostPawJS/grimoire/compare/v0.2.11...v0.2.12
[0.2.13]: https://github.com/GhostPawJS/grimoire/compare/v0.2.12...v0.2.13
[0.2.14]: https://github.com/GhostPawJS/grimoire/compare/v0.2.13...v0.2.14
[0.2.0]: https://github.com/GhostPawJS/grimoire/releases/tag/v0.2.0
