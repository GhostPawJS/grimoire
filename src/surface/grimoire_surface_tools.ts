import type { SurfaceTool } from '../surfaces/surface_types.ts';
import type { GrimoireToolContext, JsonSchema } from '../tools/tool_metadata.ts';
import { grimoireTools } from '../tools/tool_registry.ts';
import { parseCliTime } from './parse_cli_time.ts';
import { parseNoteContent } from './parse_note_content.ts';

// Enum values, containers, and array item types do not need repeated prose.
function compactSchema(schema: JsonSchema, field = true): JsonSchema {
	const { description, ...rest } = schema;
	return {
		...rest,
		...(description && field && !schema.enum && schema.type !== 'object' && schema.type !== 'array'
			? { description }
			: {}),
		...(schema.properties
			? {
					properties: Object.fromEntries(
						Object.entries(schema.properties).map(([key, value]) => [key, compactSchema(value)]),
					),
				}
			: {}),
		...(schema.items ? { items: compactSchema(schema.items, false) } : {}),
		...(schema.oneOf ? { oneOf: schema.oneOf.map((branch) => compactSchema(branch)) } : {}),
	};
}

const grimoireMcpSurfaceTools: readonly SurfaceTool<GrimoireToolContext>[] = grimoireTools.map(
	(tool) => ({
		name: tool.name,
		description: tool.description,
		whenToUse: '',
		readOnly: tool.readOnly,
		sideEffects: tool.sideEffects,
		inputSchema: { ...compactSchema(tool.inputSchema), type: 'object' },
		handler: tool.handler as SurfaceTool<GrimoireToolContext>['handler'],
	}),
);

const mapping: Record<string, NonNullable<SurfaceTool<GrimoireToolContext>['cli']>> = {
	search_grimoire: { verb: 'search', positionals: ['query'] },
	review_grimoire: { verb: 'review', positionals: ['view'] },
	inspect_grimoire_item: { verb: 'inspect', positionals: ['path'] },
	inscribe_spell: { noun: 'spell', verb: 'inscribe', positionals: ['name'], fileArgs: ['content'] },
	update_spell: { noun: 'spell', verb: 'update', positionals: ['path'], fileArgs: ['content'] },
	hone_spell: { noun: 'spell', verb: 'hone', positionals: ['paths'] },
	manage_spell: {
		noun: 'spell',
		verb: 'manage',
		action: {
			property: 'action',
			verbs: { repair_all: 'repair-all' },
			descriptions: {
				shelve: 'Archive a spell and checkpoint the move.',
				unshelve: 'Restore an archived spell.',
				move: 'Move a spell to another chapter or name.',
				delete: 'Delete a spell and its events.',
				repair: 'Repair a spell and checkpoint fixes.',
				repair_all: 'Repair all discovered spells.',
				rollback: 'Restore a spell from an inspect history hash.',
			},
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
			descriptions: {
				submit: 'Propose a spell backed by existing notes.',
				approve: 'Approve a pending draft.',
				dismiss: 'Dismiss a pending draft.',
			},
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
			descriptions: {
				adopt: 'Import skills from a skill directory, parent directory, or remote source.',
				search: 'Search external skill registries.',
				check_updates: 'Check adopted skills for upstream updates.',
				apply_update: 'Apply or reconcile an upstream update.',
			},
			positionals: { adopt: ['source'], search: ['query'], apply_update: ['path'] },
		},
	},
};
const grimoireSurfaceTools = /* @__PURE__ */ grimoireMcpSurfaceTools.map((tool) => ({
	...tool,
	...(mapping[tool.name]
		? {
				cli: {
					verb: mapping[tool.name]?.verb ?? tool.name,
					...mapping[tool.name],
					valueParsers: {
						now: parseCliTime,
						...(tool.name === 'drop_note' ? { content: parseNoteContent } : {}),
					},
				},
			}
		: {}),
}));
export { grimoireMcpSurfaceTools, grimoireSurfaceTools };
