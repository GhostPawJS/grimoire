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
	about: grimoireMcpInstructions,
	tools: grimoireSurfaceTools.map((tool) => ({
		...tool,
		example: grimoireToolExamples[tool.name] ?? {},
	})),
	workflows: grimoireSkills,
	principles: ['Search before writing. Preserve provenance. Seal changes after review.'],
};
