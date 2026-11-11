import { join, resolve } from 'node:path';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import { jsonLine } from '../surfaces/json_line.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { grimoireVersion } from '../version.ts';
import { grimoireSurfaceTools } from './grimoire_surface_tools.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';
import { resolveGrimoireRoot } from './resolve_grimoire_root.ts';

function contextOptions(options: { db?: string; root?: string; gitDir?: string }) {
	return {
		...(options.db === undefined ? {} : { dbPath: options.db }),
		...(options.root === undefined ? {} : { root: options.root }),
		...(options.gitDir === undefined ? {} : { gitDir: options.gitDir }),
	};
}

export const grimoireCliOptions: ToolCliOptions<GrimoireToolContext> = {
	bin: 'ghostpaw-grimoire',
	version: grimoireVersion,
	description: 'Local procedural knowledge',
	describeDb: (options) => {
		const root = resolveGrimoireRoot(options);
		return `State: DB ${resolveGrimoireDbPath(options.db ? { flag: options.db } : {})}\nRoot ${root}\nGit ${resolve(options.gitDir ?? (process.env.GHOSTPAW_GRIMOIRE_GIT_DIR || undefined) ?? join(root, '.grimoire-git'))}\nEnvironment: GHOSTPAW_GRIMOIRE_DB, GHOSTPAW_GRIMOIRE_ROOT, GHOSTPAW_GRIMOIRE_GIT_DIR`;
	},
	tools: grimoireSurfaceTools,
	formatResult: (result, tool, _input, quiet, compact) => {
		if (quiet) return '';
		if (compact && tool.name === 'inspect_grimoire_item' && (result as { ok?: boolean }).ok) {
			const record = result as {
				data: { spell: { content?: string; body?: string }; history?: unknown[] };
				[key: string]: unknown;
			};
			const { content: _content, body: _body, ...spell } = record.data.spell;
			const history = record.data.history ?? [];
			return `${JSON.stringify({ ...record, data: { ...record.data, spell, history: undefined, historyCount: history.length, lastCommit: history[0] ?? null } })}\n`;
		}
		if (tool.readOnly) return jsonLine(result, compact);
		const record = result as {
			summary: string;
			outcome?: string;
			data?: { commitHash?: string; rollbackHash?: string };
		};
		const data = record.data;
		const hash = data?.commitHash || data?.rollbackHash;
		return `${record.summary}\n${hash ? `${data?.commitHash && record.outcome !== 'no_op' ? 'commit' : 'rollback'} ${hash.slice(0, 8)}\n` : ''}`;
	},
	openContext: async (options) => {
		const { openGrimoireContext } = await import('./open_grimoire_context.ts');
		return openGrimoireContext({
			...(options.readOnly ? { readOnly: true } : {}),
			...contextOptions(options),
		});
	},
	closeContext: (ctx) => ctx.db?.close(),
	commands: {
		mcp: async (options) => {
			const { serveGrimoireMcp } = await import('./serve_grimoire_mcp.ts');
			await serveGrimoireMcp({
				...contextOptions(options),
			});
		},
		skill: async (args) => {
			const { renderGrimoireSkillCommand } = await import('./render_grimoire_skill_command.ts');
			return renderGrimoireSkillCommand(args);
		},
	},
};
