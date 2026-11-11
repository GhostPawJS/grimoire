import type { GrimoireDb } from '../database.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { serveMcpStdio } from '../surfaces/mcp_stdio.ts';
import { grimoireMcpOptions } from './grimoire_mcp_options.ts';
import { openGrimoireContext } from './open_grimoire_context.ts';
export async function serveGrimoireMcp(
	options: { db?: GrimoireDb; dbPath?: string; root?: string; gitDir?: string } = {},
): Promise<void> {
	let owned: GrimoireDb | undefined;
	let reader: Awaited<ReturnType<typeof openGrimoireContext>> | undefined;
	let readerContext: ReturnType<typeof openGrimoireContext> | undefined;
	const server = createMcpServer(
		grimoireMcpOptions(
			async () => {
				const context = await openGrimoireContext(options);
				if (!options.db) owned = context.db;
				return context;
			},
			(tool, input) => {
				if (tool.name !== 'review_grimoire' || input.view !== 'check') return undefined;
				readerContext ??= openGrimoireContext({ ...options, readOnly: true }).then((context) => {
					reader = context;
					return context;
				});
				return readerContext;
			},
		),
	);
	try {
		await serveMcpStdio(server);
	} finally {
		owned?.close();
		if (!options.db) reader?.db.close();
	}
}
