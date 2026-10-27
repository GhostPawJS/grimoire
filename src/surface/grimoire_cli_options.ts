import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { grimoireVersion } from '../version.ts';
import { grimoireSurfaceTools } from './grimoire_surface_tools.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';

export const grimoireCliOptions: ToolCliOptions<GrimoireToolContext> = {
	bin: 'ghostpaw-grimoire',
	version: grimoireVersion,
	description: 'Local procedural knowledge',
	describeDb: (options) => {
		const root = resolve(
			options.root ??
				(process.env.GHOSTPAW_GRIMOIRE_ROOT || join(homedir(), '.ghostpaw', 'grimoire')),
		);
		return `State: DB ${resolveGrimoireDbPath(options.db ? { flag: options.db } : {})}\nRoot ${root}\nGit ${resolve(options.gitDir ?? (process.env.GHOSTPAW_GRIMOIRE_GIT_DIR || undefined) ?? join(root, '.grimoire-git'))}\nEnvironment: GHOSTPAW_GRIMOIRE_DB, GHOSTPAW_GRIMOIRE_ROOT, GHOSTPAW_GRIMOIRE_GIT_DIR`;
	},
	tools: grimoireSurfaceTools,
	openContext: async (options) => {
		const { openGrimoireContext } = await import('./open_grimoire_context.ts');
		return openGrimoireContext({
			...(options.db === undefined ? {} : { dbPath: options.db }),
			...(options.root === undefined ? {} : { root: options.root }),
			...(options.gitDir === undefined ? {} : { gitDir: options.gitDir }),
		});
	},
	closeContext: (ctx) => ctx.db?.close(),
	commands: {
		mcp: async (options) => {
			const { serveGrimoireMcp } = await import('./serve_grimoire_mcp.ts');
			await serveGrimoireMcp({
				...(options.db === undefined ? {} : { dbPath: options.db }),
				...(options.root === undefined ? {} : { root: options.root }),
				...(options.gitDir === undefined ? {} : { gitDir: options.gitDir }),
			});
		},
		skill: async (args) => {
			const { renderGrimoireSkillCommand } = await import('./render_grimoire_skill_command.ts');
			return renderGrimoireSkillCommand(args);
		},
	},
};
