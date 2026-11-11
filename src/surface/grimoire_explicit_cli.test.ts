import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	closeSync,
	existsSync,
	mkdtempSync,
	openSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

function fixture() {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-explicit-'));
	const env = {
		...process.env,
		HOME: dir,
		GHOSTPAW_GRIMOIRE_DB: '',
		GHOSTPAW_GRIMOIRE_ROOT: join(dir, 'root'),
		GHOSTPAW_GRIMOIRE_GIT_DIR: '',
		GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '',
		GHOSTPAW_QUIET: '',
	};
	return {
		dir,
		env,
		run(args: string[], extra: NodeJS.ProcessEnv = {}, input = '', entry = 'src/cli.ts') {
			const inputPath = join(dir, 'stdin');
			writeFileSync(inputPath, input);
			const out = join(dir, 'stdout'),
				err = join(dir, 'stderr');
			const fds = [openSync(inputPath, 'r'), openSync(out, 'w'), openSync(err, 'w')];
			try {
				const result = spawnSync(
					process.execPath,
					['--no-warnings', '--experimental-strip-types', resolve(entry), ...args],
					{ env: { ...env, ...extra }, stdio: fds },
				);
				assert.ifError(result.error);
				return {
					status: result.status,
					stdout: readFileSync(out, 'utf8'),
					stderr: readFileSync(err, 'utf8'),
				};
			} finally {
				for (const fd of fds) closeSync(fd);
			}
		},
		close() {
			rmSync(dir, { recursive: true, force: true });
		},
	};
}

test('default DB notices and explicit refusal preserve CLI output and avoid default writes', () => {
	for (const [args, extra, notice, status] of [
		[['review', 'index', '--json'], {}, true, 0],
		[['review', 'index', '-q'], {}, false, 0],
		[['review', 'index', '--quiet'], {}, false, 0],
		[['review', 'index'], { GHOSTPAW_QUIET: '1' }, false, 0],
		[['review', 'index', '--db', ':memory:'], {}, false, 0],
		[['review', 'index'], { GHOSTPAW_GRIMOIRE_DB: ':memory:' }, false, 0],
		[['--help'], {}, false, 0],
		[['--version'], {}, false, 0],
		[['skill'], {}, false, 0],
		[['review', 'index'], { GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' }, false, 2],
		[
			['review', 'index', '--root', 'unused', '--git-dir', 'unused'],
			{ GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' },
			false,
			2,
		],
		[
			['review', 'index', '--db', ':memory:'],
			{ GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' },
			false,
			0,
		],
		[['mcp'], { GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' }, false, 2],
		[
			['review', 'index'],
			{ GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1', GHOSTPAW_GRIMOIRE_DB: ':memory:' },
			false,
			0,
		],
		[['--help'], { GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' }, false, 0],
		[['--version'], { GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' }, false, 0],
		[['skill'], { GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' }, false, 0],
	] as [string[], NodeJS.ProcessEnv, boolean, number][]) {
		const f = fixture();
		try {
			const result = f.run(args, extra);
			assert.equal(result.status, status, result.stderr);
			assert.equal(result.stderr.includes('using default db '), notice, args.join(' '));
			if (notice)
				assert.equal(result.stderr, `using default db ${join(f.dir, '.ghostpaw/grimoire.db')}\n`);
			if (notice)
				assert.equal(
					result.stdout,
					f.run([...args, '--db', join(f.dir, '.ghostpaw/grimoire.db')]).stdout,
				);
			if (status === 2) {
				for (const name of [
					'--db',
					'--root',
					'--git-dir',
					'GHOSTPAW_GRIMOIRE_DB',
					'GHOSTPAW_GRIMOIRE_ROOT',
					'GHOSTPAW_GRIMOIRE_GIT_DIR',
				])
					assert.ok(result.stderr.includes(name));
				assert.equal(result.stdout, '');
				assert.equal(existsSync(join(f.dir, '.ghostpaw')), false);
				assert.equal(existsSync(f.env.GHOSTPAW_GRIMOIRE_ROOT), false);
			}
		} finally {
			f.close();
		}
	}
});

test('hone paths, all, warnings, and strict refusal leave the expected edits pending', () => {
	for (const [args, strict, code, warning, sealed] of [
		[[], false, 0, true, 2],
		[['--all'], false, 0, false, 2],
		[['ops/first'], false, 0, false, 1],
		[[], true, 2, false, 0],
		[['--all'], true, 0, false, 2],
		[['--all', 'ops/first'], false, 2, false, 0],
		[['ops/first', '--all'], true, 2, false, 0],
		[['ops/first'], true, 0, false, 1],
		[['--all=false'], false, 0, true, 2],
		[['-q'], false, 0, true, 2],
	] as [string[], boolean, number, boolean, number][]) {
		const f = fixture();
		try {
			const db = join(f.dir, 'state.db');
			for (const name of ['first', 'second']) {
				const content = `---\nname: ${name}\ndescription: Test procedure\n---\n# Procedure\n\nVerify the build.`;
				const added = f.run([
					'--db',
					db,
					'spell',
					'inscribe',
					name,
					'--chapter',
					'ops',
					'--content',
					content,
				]);
				assert.equal(added.status, 0, added.stderr);
				const file = join(f.env.GHOSTPAW_GRIMOIRE_ROOT, 'ops', name, 'SKILL.md');
				writeFileSync(file, `${readFileSync(file, 'utf8')}\nCheck results.\n`);
			}
			const result = f.run(['--db', db, 'spell', 'hone', ...args, '--json'], {
				GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: strict ? '1' : '',
			});
			assert.equal(result.status, code, result.stderr);
			if (warning) {
				assert.match(result.stderr, /WARNING/);
				for (const path of ['ops/first', 'ops/second']) assert.ok(result.stderr.includes(path));
				assert.match(
					result.stderr,
					/pass spell paths or --all; bare hone will require --all in a future minor/,
				);
			} else if (!code) assert.equal(result.stderr, '');
			if (!code && !args.includes('-q'))
				assert.equal(JSON.parse(result.stdout).data.sealedPaths.length, sealed);
			const pendingFd = openSync(join(f.dir, 'pending'), 'w');
			const pending = spawnSync(
				'git',
				[
					'--git-dir',
					join(f.env.GHOSTPAW_GRIMOIRE_ROOT, '.grimoire-git'),
					'--work-tree',
					f.env.GHOSTPAW_GRIMOIRE_ROOT,
					'status',
					'--porcelain',
				],
				{ stdio: ['ignore', pendingFd, 'inherit'] },
			);
			closeSync(pendingFd);
			assert.ifError(pending.error);
			assert.equal(pending.status, 0);
			assert.equal(
				readFileSync(join(f.dir, 'pending'), 'utf8').trim().split('\n').filter(Boolean).length,
				2 - sealed,
			);
		} finally {
			f.close();
		}
	}
});

test('MCP emits one default notice for multiple calls, with quiet suppression', () => {
	for (const entry of ['src/cli.ts', 'src/mcp_server_bin.ts']) {
		for (const [args, extra, notice] of [
			[[], {}, true],
			[['-q'], {}, false],
			[[], { GHOSTPAW_QUIET: '1' }, false],
			[['--db', ':memory:'], {}, false],
		] as [string[], NodeJS.ProcessEnv, boolean][]) {
			const f = fixture();
			try {
				const input = `${[0, 1, 2]
					.map((id) =>
						JSON.stringify({
							jsonrpc: '2.0',
							id,
							method: id === 0 ? 'initialize' : 'tools/call',
							params:
								id === 0
									? {
											protocolVersion: '2025-11-25',
											capabilities: {},
											clientInfo: { name: 'test', version: '1' },
										}
									: { name: 'review_grimoire', arguments: { view: 'index' } },
						}),
					)
					.join('\n')}\n`;
				const result = f.run(entry === 'src/cli.ts' ? ['mcp', ...args] : args, extra, input, entry);
				assert.equal(result.status, 0, result.stderr);
				assert.equal(
					result.stderr,
					notice ? `using default db ${join(f.dir, '.ghostpaw/grimoire.db')}\n` : '',
				);
				assert.equal(result.stdout.trim().split('\n').length, 3);
			} finally {
				f.close();
			}
		}
	}
});

test('standalone MCP refuses the default database before creating storage', () => {
	const f = fixture();
	try {
		const result = f.run(
			[],
			{ GHOSTPAW_GRIMOIRE_REQUIRE_EXPLICIT: '1' },
			'',
			'src/mcp_server_bin.ts',
		);
		assert.equal(result.status, 2, result.stderr);
		assert.equal(result.stdout, '');
		assert.match(result.stderr, /--db\/GHOSTPAW_GRIMOIRE_DB/);
		assert.equal(existsSync(join(f.dir, '.ghostpaw')), false);
		assert.equal(existsSync(f.env.GHOSTPAW_GRIMOIRE_ROOT), false);
	} finally {
		f.close();
	}
});
