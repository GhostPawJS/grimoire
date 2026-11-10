import { grimoireSkills } from '../skills/skill_registry.ts';
import { grimoireCheatSheet } from './grimoire_cheat_sheet.ts';
import { grimoireMcpInstructions } from './grimoire_mcp_instructions.ts';
import { grimoireSurfaceTools } from './grimoire_surface_tools.ts';
import { grimoireToolExamples } from './grimoire_tool_examples.ts';

export const grimoireSkillSpec = {
	name: 'grimoire',
	description:
		'Store, search, and maintain procedural knowledge as local spells with notes and revision history. Use when maintaining procedures or capturing practical knowledge.',
	license: 'MIT',
	compatibility:
		'Release binary needs no runtime installation. MCP stdio or ghostpaw-grimoire CLI.',
	installation:
		'## Install\n\nInstall the release binary; the installer verifies SHA256SUMS. Add ~/.local/bin to PATH.\n\n```sh\ncurl -fsSL https://raw.githubusercontent.com/GhostPawJS/grimoire/main/install.sh | sh\nexport PATH="$HOME/.local/bin:$PATH"\n```\n\nOn Windows, use install.ps1 from the same repository; it also verifies SHA256SUMS.',
	cheatSheet: grimoireCheatSheet,
	bin: 'ghostpaw-grimoire',
	packageName: '@ghostpaw/grimoire',
	server: 'ghostpaw-grimoire',
	about: `${grimoireMcpInstructions}

## Running inside sandboxed agent harnesses

Inside a Codex CLI \`--sandbox workspace-write\` session, the database and its
parent directory must be inside a writable root, including SQLite's \`-wal\` and
\`-shm\` side files. A default DB under \`~/.ghostpaw\` outside those roots can fail
with \`SQLITE_CANTOPEN\` or \`EPERM\` (often exit 70; directory creation failures
may exit 2), even when normal shell permissions allow access. Put the DB inside the workspace with \`--db ./state/grimoire.db\`,
or set \`GHOSTPAW_GRIMOIRE_DB="$PWD/state/grimoire.db"\` for CLI/MCP use.

To use an external DB directory, add it when starting the OpenAI Codex CLI
(replace \`<dir-with-db>\` with its absolute path):

\`\`\`sh
codex exec --sandbox workspace-write --add-dir <dir-with-db> "Run the GhostPaw CLI"
\`\`\`

Alternatively, set \`sandbox_workspace_write.writable_roots\` in
\`~/.codex/config.toml\` before starting the session:

\`\`\`toml
[sandbox_workspace_write]
writable_roots = ["/absolute/dir-with-db"]
\`\`\`

The spell root and Git directory must also be inside writable roots. Select
\`--root ./state/spells\` (or \`GHOSTPAW_GRIMOIRE_ROOT\`) as well as \`--db\`;
\`--db\` alone does not relocate the spell root. Git defaults to
\`<root>/.grimoire-git\`; keep it there or select a writable directory with
\`--git-dir ./state/spell-history\` / \`GHOSTPAW_GRIMOIRE_GIT_DIR\`. Add each
external directory with another \`--add-dir\` or writable_roots entry. Avoid a
protected workspace \`.git\` directory; use the dedicated spell history directory.
`,
	tools: grimoireSurfaceTools.map((tool) => ({
		...tool,
		example: grimoireToolExamples[tool.name] ?? {},
	})),
	workflows: grimoireSkills,
	principles: ['Search before writing. Preserve provenance. Seal changes after review.'],
};
