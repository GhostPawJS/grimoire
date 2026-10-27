// Smoke test for a built SEA binary: version, a SQLite write and read, and an
// MCP initialize + tools/list round trip over stdio.
//   node scripts/sea/smoke.mjs [path-to-binary]   (default: this host's build in dist-sea/)
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`;
const binary = resolve(
	process.argv[2] ??
		`dist-sea/${host}/ghostpaw-grimoire${process.platform === 'win32' ? '.exe' : ''}`,
);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'sea-smoke-'));
const db = join(dir, 'grimoire.db');
// The spell root is created with `git init`, which prints a branch-name hint to
// stderr when init.defaultBranch is unset. Pin git's own default to keep stderr empty.
const env = {
	...process.env,
	GHOSTPAW_GRIMOIRE_ROOT: join(dir, 'spells'),
	GIT_CONFIG_COUNT: '1',
	GIT_CONFIG_KEY_0: 'init.defaultBranch',
	GIT_CONFIG_VALUE_0: 'master',
};
const fail = (message) => {
	console.error(`smoke: ${message}`);
	process.exit(1);
};
const run = (args) => {
	const r = spawnSync(binary, args, { encoding: 'utf8', env });
	if (r.status !== 0) fail(`${args.join(' ')} exited ${r.status}\n${r.stderr}`);
	if (r.stderr) fail(`${args.join(' ')} wrote to stderr:\n${r.stderr}`);
	return r.stdout;
};

const version = run(['--version']).trim();
if (version !== pkg.version) fail(`--version printed ${version}, expected ${pkg.version}`);
run(['--help']);
const added = JSON.parse(
	run(['note', 'drop', 'Binary smoke marker', '--source', 'smoke', '--db', db, '--json']),
);
if (!added.ok) fail(`write failed: ${JSON.stringify(added)}`);
const found = JSON.parse(run(['review', 'notes', '--db', db, '--json']));
if (found.data?.notes?.length !== 1) fail(`read failed: ${JSON.stringify(found)}`);

const tools = await new Promise((done) => {
	const child = spawn(binary, ['mcp', '--db', db], {
		stdio: ['pipe', 'pipe', 'pipe'],
		env,
	});
	let out = '';
	let err = '';
	child.stderr.on('data', (chunk) => {
		err += String(chunk);
	});
	const timer = setTimeout(() => fail('mcp did not answer within 10 s'), 10_000);
	child.stdout.setEncoding('utf8');
	child.stdout.on('data', (chunk) => {
		out += chunk;
		const line = out.split('\n').find((l) => l.includes('"id":2'));
		if (!line) return;
		clearTimeout(timer);
		const initialized = out
			.split('\n')
			.filter(Boolean)
			.map((value) => JSON.parse(value))
			.some((reply) => reply.id === 1 && reply.result?.serverInfo);
		if (!initialized) fail('mcp initialize returned no serverInfo');
		const listed = JSON.parse(line).result?.tools ?? [];
		child.once('exit', (code) => {
			if (code !== 0 || err) fail(`mcp exited ${code}: ${err}`);
			done(listed);
		});
		child.stdin.end();
	});
	const send = (msg) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...msg })}\n`);
	send({
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-06-18',
			capabilities: {},
			clientInfo: { name: 'smoke', version: '0' },
		},
	});
	send({ method: 'notifications/initialized' });
	send({ id: 2, method: 'tools/list' });
});
if (tools.length === 0) fail('mcp tools/list returned no tools');
rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
console.log(`smoke ok: ${binary} ${version}, sqlite write+read, mcp ${tools.length} tools`);
