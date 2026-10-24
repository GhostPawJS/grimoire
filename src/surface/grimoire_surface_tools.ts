import type { SurfaceTool } from '../surfaces/surface_types.ts';
import type { GrimoireToolContext } from '../tools/tool_metadata.ts';
import { grimoireTools } from '../tools/tool_registry.ts';

export const grimoireSurfaceTools: readonly SurfaceTool<GrimoireToolContext>[] = grimoireTools.map(
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
