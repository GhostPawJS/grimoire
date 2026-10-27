import type { ToolCliOptions } from '../surfaces/cli.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { grimoireVersion } from '../version.ts';
import { grimoireSurfaceTools } from './grimoire_surface_tools.ts';

export const grimoireCliOptions: ToolCliOptions<GrimoireToolContext> = {
	bin: 'ghostpaw-grimoire',
	version: grimoireVersion,
	description: 'Local procedural knowledge',
	tools: grimoireSurfaceTools,
	openContext: async (options) => {
		const { openGrimoireContext } = await import('./open_grimoire_context.ts');
		return openGrimoireContext(options.db === undefined ? {} : { dbPath: options.db });
	},
	closeContext: (ctx) => ctx.db?.close(),
	commands: {
		mcp: async (options) => {
			const { serveGrimoireMcp } = await import('./serve_grimoire_mcp.ts');
			await serveGrimoireMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async () => {
			const { renderSkillMarkdown } = await import('../surfaces/skill_markdown.ts');
			const { grimoireSkillSpec } = await import('./grimoire_skill_spec.ts');
			return renderSkillMarkdown(grimoireSkillSpec);
		},
	},
};
