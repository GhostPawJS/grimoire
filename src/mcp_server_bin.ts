import { defaultGrimoireDb } from './surface/default_grimoire_db.ts';

const args = process.argv.slice(2);
let dbPath: string | undefined;
for (let i = 0; i < args.length; i++) {
	if (args[i] === '-q' || args[i] === '--quiet') continue;
	if (args[i] !== '--db' || !args[i + 1]) throw new Error('Usage: mcp-server [--db <path>] [-q]');
	dbPath = args[++i];
}
const { serveGrimoireMcp } = await import('./surface/serve_grimoire_mcp.ts');
try {
	defaultGrimoireDb(dbPath);
} catch (error) {
	process.stderr.write(`${(error as Error).message}\n`);
	process.exitCode = 2;
}
if (!process.exitCode) await serveGrimoireMcp(dbPath === undefined ? {} : { dbPath });
