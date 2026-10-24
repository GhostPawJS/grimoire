import { grimoireSkills } from '../skills/skill_registry.ts';
import { grimoireMcpInstructions } from './grimoire_mcp_instructions.ts';
import { grimoireSurfaceTools } from './grimoire_surface_tools.ts';

export const grimoireSkillSpec = {
	name: 'grimoire',
	description:
		'Store, search, and maintain procedural knowledge as local spells with notes and revision history. Use when maintaining procedures or capturing practical knowledge.',
	license: 'MIT',
	compatibility: 'Node.js 24 or newer. MCP stdio or ghostpaw-grimoire CLI.',
	bin: 'ghostpaw-grimoire',
	packageName: '@ghostpaw/grimoire',
	server: 'ghostpaw-grimoire',
	about: grimoireMcpInstructions,
	tools: grimoireSurfaceTools,
	workflows: grimoireSkills,
	principles: ['Search before writing. Preserve provenance. Seal changes after review.'],
};
