import type { SurfaceTool } from '../surfaces/surface_types.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { grimoireTools } from '../tools/tool_registry.ts';

const grimoireMcpSurfaceTools: readonly SurfaceTool<GrimoireToolContext>[] = grimoireTools.map(
	(tool) => ({
		name: tool.name,
		description: tool.description,
		whenToUse: tool.whenToUse,
		...(tool.whenNotToUse === undefined ? {} : { whenNotToUse: tool.whenNotToUse }),
		readOnly: tool.readOnly,
		sideEffects: tool.sideEffects,
		inputSchema: { ...tool.inputSchema, type: 'object' },
		handler: tool.handler as SurfaceTool<GrimoireToolContext>['handler'],
	}),
);

const mapping: Record<string, NonNullable<SurfaceTool<GrimoireToolContext>['cli']>> = {
	search_grimoire: { verb: 'search', positionals: ['query'] },
	review_grimoire: { verb: 'review', positionals: ['view'] },
	inspect_grimoire_item: { verb: 'inspect', positionals: ['path'] },
	inscribe_spell: { noun: 'spell', verb: 'inscribe', positionals: ['name'] },
	update_spell: { noun: 'spell', verb: 'update', positionals: ['path'] },
	hone_spell: { noun: 'spell', verb: 'hone', positionals: ['path'] },
	manage_spell: {
		noun: 'spell',
		verb: 'manage',
		action: {
			property: 'action',
			verbs: { repair_all: 'repair-all' },
			positionals: {
				shelve: ['path'],
				unshelve: ['path'],
				move: ['path', 'target'],
				delete: ['path'],
				repair: ['path'],
				rollback: ['path', 'ref'],
			},
		},
	},
	drop_note: { noun: 'note', verb: 'drop', positionals: ['content'] },
	manage_draft: {
		noun: 'draft',
		verb: 'manage',
		action: {
			property: 'action',
			positionals: { submit: ['title'], approve: ['draftId'], dismiss: ['draftId'] },
		},
	},
	run_catalogue: { noun: 'catalogue', verb: 'run' },
	scout_skills: {
		noun: 'scout',
		verb: 'manage',
		action: {
			property: 'action',
			verbs: { check_updates: 'check-updates', apply_update: 'apply-update' },
			positionals: { adopt: ['source'], search: ['query'], apply_update: ['path'] },
		},
	},
};
const grimoireSurfaceTools = /* @__PURE__ */ grimoireMcpSurfaceTools.map((tool) => ({
	...tool,
	...(mapping[tool.name] ? { cli: mapping[tool.name] } : {}),
}));
export { grimoireMcpSurfaceTools, grimoireSurfaceTools };
