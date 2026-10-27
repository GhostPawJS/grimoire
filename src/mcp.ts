import type { GrimoireDb } from './database.ts';
import { grimoireMcpOptions } from './surface/grimoire_mcp_options.ts';
import { openGrimoireContext } from './surface/open_grimoire_context.ts';
import { createMcpServer } from './surfaces/mcp_server.ts';

export { grimoireMcpInstructions } from './surface/grimoire_mcp_instructions.ts';
export { serveGrimoireMcp } from './surface/serve_grimoire_mcp.ts';
export type { McpServerOptions } from './surfaces/mcp_server.ts';
export {
	createMcpServer,
	MCP_LATEST_PROTOCOL_VERSION,
	MCP_SUPPORTED_PROTOCOL_VERSIONS,
} from './surfaces/mcp_server.ts';
export { serveMcpStdio } from './surfaces/mcp_stdio.ts';
export type * from './surfaces/surface_types.ts';

export function createGrimoireMcpServer(
	options: { db?: GrimoireDb; dbPath?: string; root?: string; gitDir?: string } = {},
) {
	return createMcpServer(grimoireMcpOptions(() => openGrimoireContext(options)));
}
