import { grimoireSurfaceTools } from './surface/grimoire_surface_tools.ts';
import { runToolCli } from './surfaces/cli.ts';
import { grimoireVersion } from './version.ts';

process.exitCode = await runToolCli(process.argv.slice(2), {
	bin: 'ghostpaw-grimoire',
	version: grimoireVersion,
	description: 'Local procedural knowledge',
	tools: grimoireSurfaceTools,
	openContext: async (options) => {
		const { openGrimoireContext } = await import('./surface/open_grimoire_context.ts');
		return openGrimoireContext(options.db === undefined ? {} : { dbPath: options.db });
	},
	closeContext: (ctx) => ctx.db?.close(),
	commands: {
		mcp: async (options) => {
			const { serveGrimoireMcp } = await import('./surface/serve_grimoire_mcp.ts');
			await serveGrimoireMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async () => {
			const { renderSkillMarkdown } = await import('./surfaces/skill_markdown.ts');
			const { grimoireSkillSpec } = await import('./surface/grimoire_skill_spec.ts');
			return renderSkillMarkdown(grimoireSkillSpec);
		},
	},
});
