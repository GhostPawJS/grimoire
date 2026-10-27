import type { GrimoireDb } from '../database.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { serveMcpStdio } from '../surfaces/mcp_stdio.ts';
import { grimoireMcpOptions } from './grimoire_mcp_options.ts';
import { openGrimoireContext } from './open_grimoire_context.ts';
export async function serveGrimoireMcp(
	options: { db?: GrimoireDb; dbPath?: string; root?: string; gitDir?: string } = {},
): Promise<void> {
	let owned: GrimoireDb | undefined;
	const server = createMcpServer(
		grimoireMcpOptions(async () => {
			const context = await openGrimoireContext(options);
			if (!options.db) owned = context.db;
			return context;
		}),
	);
	try {
		await serveMcpStdio(server);
	} finally {
		owned?.close();
	}
}
