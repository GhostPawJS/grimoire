import assert from 'node:assert/strict';
export const packageName = '@ghostpaw/grimoire';
export const publicEntries = ['.', './mcp'];
export const binName = 'ghostpaw-grimoire';
export const extraFiles = ['SKILL.md', 'skills/grimoire/SKILL.md'];
export const entries = {
	full: `export * from './dist/index.js';`,
	tools: `import {tools} from './dist/index.js'; export const registry = tools.grimoireTools;`,
	'read-write': `export {read, write} from './dist/index.js';`,
	mcp: `export * from './dist/mcp.js';`,
	cli: { entryPoints: ['dist/cli.js'] },
	'mcp-server': { entryPoints: ['dist/mcp-server.js'] },
};
export const claim = {
	name: 'release-check',
	content:
		'---\nname: release-check\ndescription: Verify releases\n---\n# Release\n\nVerify the build before release.',
};
export const search = { query: 'release-check' };
export const modernMeta = {
	'io.modelcontextprotocol/protocolVersion': '2026-07-28',
	'io.modelcontextprotocol/clientCapabilities': {},
};
export const discover = {
	jsonrpc: '2.0',
	id: 4,
	method: 'server/discover',
	params: { _meta: modernMeta },
};
export const searchRequest = {
	jsonrpc: '2.0',
	id: 5,
	method: 'tools/call',
	params: { name: 'search_grimoire', arguments: search, _meta: modernMeta },
};
export const legacyRequests = [
	{
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-11-25',
			capabilities: {},
			clientInfo: { name: 'guard', version: '1' },
		},
	},
	{ jsonrpc: '2.0', id: 2, method: 'tools/list' },
	{
		jsonrpc: '2.0',
		id: 3,
		method: 'tools/call',
		params: { name: 'search_grimoire', arguments: search },
	},
];
export const cliRemember = ['call', 'inscribe_spell', JSON.stringify(claim)];
export const cliSearch = ['call', 'search_grimoire', JSON.stringify(search)];
export function assertApi(root, mcp) {
	for (const key of ['initGrimoireTables', 'read', 'write', 'tools']) assert.ok(root[key], key);
	assert.equal(typeof mcp.createGrimoireMcpServer, 'function');
}
export function smokeLibrary(api, db) {
	api.initGrimoireTables(db);
	const note = api.write.dropNote(db, { source: 'practice', content: 'Verify build' });
	assert.ok(api.read.pendingNotes(db).some((value) => value.id === note.id));
}
export const typeConsumer = `import {DatabaseSync} from 'node:sqlite';
import {initGrimoireTables, read, write} from '${packageName}';
import {createGrimoireMcpServer} from '${packageName}/mcp';
const db = new DatabaseSync(':memory:'); initGrimoireTables(db);
write.dropNote(db, {source:'practice',content:'Verify build'});
read.pendingNotes(db); createGrimoireMcpServer({db, root: '.'});`;
export function createServer(mcp, db) {
	return mcp.createGrimoireMcpServer({ db, root: process.env.GHOSTPAW_GRIMOIRE_ROOT });
}
export function hotPaths(api, db, server) {
	return {
		'write.dropNote': (i) => api.write.dropNote(db, seedClaim(i)),
		'read.pendingNotes': () => api.read.pendingNotes(db),
		'MCP tools/call': () => server.handleLine(JSON.stringify(searchRequest)),
	};
}
export function seedClaim(i) {
	return { source: 'benchmark', content: `Verify release project ${i} build and tests` };
}

export function consumerSmoke(configUrl) {
	return `import {createRequire} from 'node:module'; import {DatabaseSync} from 'node:sqlite';
 import {assertApi,smokeLibrary} from ${JSON.stringify(configUrl)};
 const require = createRequire(import.meta.url);
 const root = await import(${JSON.stringify(packageName)}); const mcp = await import(${JSON.stringify(`${packageName}/mcp`)});
 assertApi(root,mcp); assertApi(require(${JSON.stringify(packageName)}),require(${JSON.stringify(`${packageName}/mcp`)}));
 const db = new DatabaseSync(':memory:'); try {smokeLibrary(root,db);} finally {db.close();}`;
}
export function assertRoundTrip(remembered, searched) {
	assert.equal(remembered.outcome, 'success');
	assert.ok(searched.data.results.some((item) => item.path === remembered.data.spell.path));
}
export function assertMcpReplies(replies, remembered) {
	assert.ok(replies[1].result.tools.some((tool) => tool.name === 'search_grimoire'));
	assert.ok(
		replies[2].result.structuredContent.data.results.some(
			(item) => item.path === remembered.data.spell.path,
		),
	);
	assert.equal(replies[3].result.resultType, 'complete');
}
