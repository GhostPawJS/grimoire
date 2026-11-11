import type { GrimoireDb } from '../database.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { serveMcpStdio } from '../surfaces/mcp_stdio.ts';
import { grimoireMcpOptions } from './grimoire_mcp_options.ts';
import { openGrimoireContext } from './open_grimoire_context.ts';
export async function serveGrimoireMcp(
	options: { db?: GrimoireDb; dbPath?: string; root?: string; gitDir?: string } = {},
): Promise<void> {
	const owned: (GrimoireDb | undefined)[] = [];
	let readerContext: ReturnType<typeof openGrimoireContext> | undefined;
	const open = async (readOnly = false) => {
		const context = await openGrimoireContext(readOnly ? { ...options, readOnly } : options);
		if (!options.db) owned[Number(readOnly)] = context.db;
		return context;
	};
	const server = createMcpServer(
		grimoireMcpOptions(
			() => open(),
			(tool, input) => {
				if (tool.name !== 'review_grimoire' || input.view !== 'check') return undefined;
				readerContext ??= open(true);
				return readerContext;
			},
		),
	);
	try {
		await serveMcpStdio(server);
	} finally {
		for (const db of owned) db?.close();
	}
}
