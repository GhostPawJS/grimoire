import type { McpServerOptions } from '../surfaces/mcp_server.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { grimoireVersion } from '../version.ts';
import { grimoireMcpInstructions } from './grimoire_mcp_instructions.ts';
import { grimoireMcpSurfaceTools } from './grimoire_surface_tools.ts';

export function grimoireMcpOptions(
	context: () => GrimoireToolContext | Promise<GrimoireToolContext>,
	contextForCall?: McpServerOptions<GrimoireToolContext>['contextForCall'],
): McpServerOptions<GrimoireToolContext> {
	return {
		name: 'ghostpaw-grimoire',
		version: grimoireVersion,
		title: 'Grimoire',
		instructions: grimoireMcpInstructions,
		tools: grimoireMcpSurfaceTools,
		context,
		...(contextForCall ? { contextForCall } : {}),
		annotations: (tool) => ({
			readOnlyHint: tool.readOnly ?? false,
			destructiveHint: ['inscribe_spell', 'manage_spell', 'manage_draft', 'run_catalogue'].includes(
				tool.name,
			),
			idempotentHint: tool.readOnly ?? false,
			openWorldHint: tool.name === 'scout_skills',
		}),
	};
}
