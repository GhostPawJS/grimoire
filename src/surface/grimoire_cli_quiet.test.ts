import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { grimoireCliOptions } from './grimoire_cli_options.ts';
import { resolveGrimoireDbPath } from './resolve_grimoire_db_path.ts';

test('quiet aliases keep stdout and stderr empty with the default database path', async () => {
	const invoke = async (args: string[]) => {
		let out = '';
		let err = '';
		const code = await runToolCli(args, {
			...grimoireCliOptions,
			stdout: new Writable({
				write(chunk, _encoding, cb) {
					out += String(chunk);
					cb();
				},
			}),
			stderr: new Writable({
				write(chunk, _encoding, cb) {
					err += String(chunk);
					cb();
				},
			}),
			openContext: () => {
				throw new Error('Informational commands must not open the default database');
			},
		});
		return { code, out, err };
	};
	const normal = await invoke(['--help']);
	assert.equal(normal.code, 0);
	assert.ok(normal.out.includes(`State: DB ${resolveGrimoireDbPath()}`));
	assert.equal(normal.err, '');
	for (const command of ['--help', '--version', 'tools']) {
		for (const flag of ['-q', '--quiet']) {
			assert.deepEqual(await invoke([flag, command]), { code: 0, out: '', err: '' });
			assert.deepEqual(await invoke([command, flag]), { code: 0, out: '', err: '' });
		}
	}
});
